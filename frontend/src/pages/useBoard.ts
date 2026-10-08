import { useEffect, useMemo, useRef, useState } from 'react';
import { toDisplayMessage, type TaskStore, type OrderingStore, type TagStore, type ProjectStore } from '../data/TaskRepository';
import { positionBetween, type BoardView } from '../services/boardInteraction';
import { applyBoardQuery, type BoardQuery } from '../services/boardQuery';
import { Task, Tag, Project, TaskInput, TaskStatus, TaskQuery, Priority } from '../services/types/task';

const PAGE_SIZE = 20;
const QUERY_DEBOUNCE_MS = 250;
const ERROR_DISMISS_MS = 5000;
const UNDO_DISMISS_MS = 5000;

export interface BoardFilters {
  view: BoardView;
  query: TaskQuery;
  tagFilter: number[];
  projectFilter: string;
}

export interface BoardActions {
  move(taskId: number, status: TaskStatus): Promise<void>;
  reorder(taskId: number, status: TaskStatus, index: number): Promise<void>;
  save(input: TaskInput, editingId?: number): Promise<void>;
  delete(id: number): Promise<void>;
  undo(): Promise<void>;
  quickAdd(title: string, status: TaskStatus): Promise<boolean>;
  loadMore(): Promise<void>;
  setQuery(patch: Partial<TaskQuery>): void;
  setView(view: BoardView): void;
  setTagFilter(ids: number[]): void;
  toggleTagFilter(id: number): void;
  clearTagFilter(): void;
  setProjectFilter(value: string): void;
  addTag(tag: Tag): void;
  removeTag(id: number): Promise<void>;
  dismissError(): void;
  pauseUndoDismiss(): void;
  resumeUndoDismiss(): void;
}

export interface BoardState {
  tasks: Task[];
  grouped: Record<string, Task[]>;
  tags: Tag[];
  projects: Project[];
  filters: BoardFilters;
  error: { message: string; id: number } | null;
  loading: boolean;
  total: number;
  lastDeleted: { id: number; title: string } | null;
  actions: BoardActions;
}

function groupByStatus(tasks: Task[]): Record<string, Task[]> {
  const grouped = tasks.reduce((acc, task) => {
    const status = task.status || TaskStatus.PENDING;
    (acc[status] ??= []).push(task);
    return acc;
  }, {} as Record<string, Task[]>);
  Object.values(grouped).forEach(list =>
    list.sort((a, b) => ((a.position ?? 0) - (b.position ?? 0)) || (a.createdAt ?? '').localeCompare(b.createdAt ?? '')));
  return grouped;
}

function applyFilters(tasks: Task[], filters: BoardFilters): Task[] {
  const query: BoardQuery = {
    view: filters.view,
    q: filters.query.q,
    priority: filters.query.priority,
    status: filters.query.status,
    tagIds: filters.tagFilter,
    projectId: filters.projectFilter ? Number(filters.projectFilter) : undefined,
  };
  return applyBoardQuery(tasks, query);
}

/** Deep module owning the board's read state and optimistic mutation policy. */
export function useBoard(repository: TaskStore & OrderingStore & TagStore & ProjectStore): BoardState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<BoardView>('all');
  const [query, setQueryState] = useState<TaskQuery>({});
  const [tagFilter, setTagFilter] = useState<number[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [error, setError] = useState<{ message: string; id: number } | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ id: number; title: string } | null>(null);
  const [pageState, setPageState] = useState(0);
  const [total, setTotal] = useState(0);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);

  const undoTimer = useRef<number | null>(null);
  const firstQueryRun = useRef(true);

  const filters: BoardFilters = { view, query, tagFilter, projectFilter };
  const grouped = useMemo(
    () => groupByStatus(applyFilters(tasks, filters)),
    [tasks, view, query, tagFilter, projectFilter],
  );

  const errorMessage = (e: unknown) => toDisplayMessage(e);

  const showError = (message: string) => {
    setError({ message, id: Date.now() });
  };

  const showTransientError = (message: string) => {
    showError(message);
    window.setTimeout(() => {
      setError(prev => (prev && prev.message === message ? null : prev));
    }, ERROR_DISMISS_MS);
  };

  const loadTasks = async (activeQuery: TaskQuery = query) => {
    try {
      const result = await repository.fetchPage(activeQuery, 0, PAGE_SIZE);
      setTasks(result.items);
      setPageState(result.page);
      setTotal(result.total);
    } catch (e) { showTransientError(errorMessage(e)); }
    finally { setTasksLoading(false); }
  };

  const loadMore = async () => {
    try {
      const result = await repository.fetchPage(query, pageState + 1, PAGE_SIZE);
      setTasks(prev => [...prev, ...result.items]);
      setPageState(result.page);
      setTotal(result.total);
    } catch (e) { showTransientError(errorMessage(e)); }
  };

  const loadProjects = async () => {
    try { setProjects(await repository.listProjects()); } catch (e) { showTransientError(errorMessage(e)); }
  };

  const loadTags = async (): Promise<Tag[] | null> => {
    try {
      const data = await repository.listTags();
      setTags(data);
      return data;
    } catch (e) {
      showTransientError(errorMessage(e));
      return null;
    } finally {
      setTagsLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks({});
    void loadTags();
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (firstQueryRun.current) {
      firstQueryRun.current = false;
      return;
    }
    const timer = window.setTimeout(() => { void loadTasks(); }, QUERY_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const move = async (taskId: number, status: TaskStatus) => {
    const previous = tasks.find(t => t.id === taskId)?.status;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    try {
      await repository.move(taskId, status);
    } catch (e) {
      if (previous !== undefined) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: previous } : t));
      }
      showTransientError(`No se pudo mover: ${errorMessage(e)}`);
    }
  };

  const reorder = async (taskId: number, status: TaskStatus, index: number) => {
    const previous = tasks.find(t => t.id === taskId);
    if (!previous) return;
    const column = (grouped[status] ?? []).filter(t => t.id !== taskId);
    const clamped = Math.max(0, Math.min(index, column.length));
    const before = clamped > 0 ? column[clamped - 1].position : undefined;
    const after = clamped < column.length ? column[clamped].position : undefined;
    const position = positionBetween(before, after);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, position } : t));
    try {
      await repository.reorder(taskId, status, position);
    } catch (e) {
      setTasks(prev => prev.map(t => t.id === taskId ? previous : t));
      showTransientError(`No se pudo mover: ${errorMessage(e)}`);
    }
  };

  const save = async (input: TaskInput, editingId?: number) => {
    if (editingId != null) {
      try {
        const saved = await repository.update(editingId, input);
        setTasks(prev => prev.map(t => t.id === editingId ? saved : t));
        await loadTags();
      } catch (e) { showTransientError(errorMessage(e)); }
    } else {
      try {
        const created = await repository.create(input);
        setTasks(prev => [...prev, created]);
        await loadTags();
      } catch (e) { showTransientError(errorMessage(e)); }
    }
  };

  const deleteTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    try {
      await repository.remove(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      if (task) {
        setLastDeleted({ id, title: task.title });
        if (undoTimer.current) window.clearTimeout(undoTimer.current);
        undoTimer.current = window.setTimeout(() => setLastDeleted(null), UNDO_DISMISS_MS);
      }
    } catch (e) { showTransientError(errorMessage(e)); }
  };

  const undo = async () => {
    if (!lastDeleted) return;
    try {
      const restored = await repository.restore(lastDeleted.id);
      setTasks(prev => [...prev, restored]);
    } catch (e) {
      showTransientError(errorMessage(e));
    } finally {
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
      setLastDeleted(null);
    }
  };

  const pauseUndoDismiss = () => {
    if (undoTimer.current) {
      window.clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
  };

  const resumeUndoDismiss = () => {
    if (lastDeleted) undoTimer.current = window.setTimeout(() => setLastDeleted(null), UNDO_DISMISS_MS);
  };

  const quickAdd = async (title: string, status: TaskStatus): Promise<boolean> => {
    try {
      const created = await repository.create({ title, priority: Priority.LOW, status, tagNames: [] });
      setTasks(prev => [...prev, created]);
      return true;
    } catch (e) {
      showTransientError(errorMessage(e));
      return false;
    }
  };

  const setQuery = (patch: Partial<TaskQuery>) => setQueryState(prev => ({ ...prev, ...patch }));

  const toggleTagFilter = (id: number) =>
    setTagFilter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const addTag = (tag: Tag) => setTags(prev => [...prev, tag]);

  const removeTag = async (id: number) => {
    setTags(prev => prev.filter(t => t.id !== id));
    setTasks(prev => prev.map(t => ({ ...t, tags: t.tags.filter(tag => tag.id !== id) })));
    await loadTags();
  };

  return {
    tasks,
    grouped,
    tags,
    projects,
    filters,
    error,
    loading: tasksLoading || tagsLoading,
    total,
    lastDeleted,
    actions: {
      move,
      reorder,
      save,
      delete: deleteTask,
      undo,
      quickAdd,
      loadMore,
      setQuery,
      setView,
      setTagFilter,
      toggleTagFilter,
      clearTagFilter: () => setTagFilter([]),
      setProjectFilter,
      addTag,
      removeTag,
      dismissError: () => setError(null),
      pauseUndoDismiss,
      resumeUndoDismiss,
    },
  };
}
