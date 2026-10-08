import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AVAILABLE_THEMES, useTheme } from '../context/ThemeContext';
import { HttpTaskRepository, toDisplayMessage, type TaskRepository } from '../data/TaskRepository';
import { filterByView, type BoardView } from '../services/boardView';
import { nextStatus, type MoveDirection } from '../services/boardKeyboard';
import { positionBetween } from '../services/taskOrdering';
import { startReminderPolling, browserNotify } from '../services/reminders';
import { useT, AVAILABLE_LANGS } from '../i18n';
import { formatNumber } from '../services/format';
import { Task, Tag, Project, TaskInput, TaskStatus, TaskQuery, TaskSort, SortDir, Priority } from '../services/types/task';
import KanbanColumn from '../components/KanbanColumn';
import AddTaskModal from '../components/AddTaskModal';
import ErrorBanner from '../components/ErrorBanner';
import styles from './TodoListPage.module.css';

const COLUMN_CONFIG: Record<string, { label: string; status: string }> = {
  PENDING: { label: 'Por hacer', status: 'PENDING' },
  ACTIVE: { label: 'En progreso', status: 'ACTIVE' },
  COMPLETED: { label: 'Hecho', status: 'COMPLETED' },
};

const PAGE_SIZE = 20;

export default function TodoListPage({ repository: repositoryProp }: { repository?: TaskRepository } = {}) {
  const { t, lang, setLang } = useT();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const repository = useMemo(() => repositoryProp ?? new HttpTaskRepository(), [repositoryProp]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState<number[]>([]);
  const [view, setView] = useState<BoardView>('all');
  const [query, setQuery] = useState<TaskQuery>({});
  const [error, setError] = useState<{ message: string; id: number } | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ id: number; title: string } | null>(null);
  const [pageState, setPageState] = useState(0);
  const [total, setTotal] = useState(0);
  const undoTimer = useRef<number | null>(null);

  useEffect(() => { loadTasks(); loadTags(); loadProjects(); }, []);

  useEffect(() => {
    const handle = startReminderPolling(browserNotify);
    return () => handle.stop();
  }, []);

  const firstQueryRun = useRef(true);
  useEffect(() => {
    if (firstQueryRun.current) {
      firstQueryRun.current = false;
      return;
    }
    const timer = window.setTimeout(() => { void loadTasks(); }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const showError = (message: string) => {
    setError({ message, id: Date.now() });
  };

  const dismissError = () => {
    setError(null);
  };

  const showTransientError = (message: string) => {
    showError(message);
    window.setTimeout(() => {
      setError(prev => (prev && prev.message === message ? null : prev));
    }, 5000);
  };

  const errorMessage = (e: unknown) => toDisplayMessage(e);

  const loadTasks = async () => {
    try {
      const result = await repository.fetchPage(query, 0, PAGE_SIZE);
      setTasks(result.items);
      setPageState(result.page);
      setTotal(result.total);
    } catch (e) { showTransientError(errorMessage(e)); }
    finally { setLoading(false); }
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

  const handleCardClick = (task: Task) => {
    const validTags = task.tags.filter(t => tags.some(x => x.id === t.id));
    setEditingTask({ ...task, tags: [...validTags] });
    setModalOpen(true);
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    const previous = tasks.find(t => t.id === taskId)?.status;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t));
    try {
      await repository.move(taskId, newStatus as TaskStatus);
    } catch (e) {
      if (previous !== undefined) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: previous } : t));
      }
      showTransientError(`No se pudo mover: ${errorMessage(e)}`);
    }
  };

  const handleSave = async (data: TaskInput) => {
    if (editingTask) {
      try {
        const saved = await repository.update(editingTask.id, data);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? saved : t));
        setEditingTask(null);
        await loadTags();
      } catch (e) { showTransientError(errorMessage(e)); }
    } else {
      try {
        const created = await repository.create(data);
        setTasks(prev => [...prev, created]);
        await loadTags();
      } catch (e) { showTransientError(errorMessage(e)); }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Eliminar esta tarea?')) return;
    const task = tasks.find(t => t.id === id);
    try {
      await repository.remove(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      if (task) {
        setLastDeleted({ id, title: task.title });
        if (undoTimer.current) window.clearTimeout(undoTimer.current);
        undoTimer.current = window.setTimeout(() => setLastDeleted(null), 5000);
      }
    } catch (e) { showTransientError(errorMessage(e)); }
  };

  const handleUndo = async () => {
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

  const handleQuickAdd = async (title: string, status: TaskStatus): Promise<boolean> => {
    try {
      const created = await repository.create({ title, priority: Priority.LOW, status, tagNames: [] });
      setTasks(prev => [...prev, created]);
      return true;
    } catch (e) {
      showTransientError(errorMessage(e));
      return false;
    }
  };

  const handleKeyboardMove = async (task: Task, direction: MoveDirection) => {
    const target = nextStatus(task.status, direction);
    if (!target) return;
    await handleStatusChange(task.id, target);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-task="${task.id}"]`) as HTMLElement | null;
      el?.focus();
    });
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    if (e.currentTarget.classList.contains('dragover')) {
      e.currentTarget.classList.remove('dragover');
    }
    const taskIdStr = (e.dataTransfer as DataTransfer).getData('text/plain');
    const taskId = parseInt(taskIdStr);
    if (!taskId || isNaN(taskId)) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && String(task.status) !== status) {
      await handleStatusChange(taskId, status);
    }
  };

  const handleReorder = async (taskId: number, status: string, index: number) => {
    const previous = tasks.find(t => t.id === taskId);
    if (!previous) return;
    const column = (grouped[status] ?? []).filter(t => t.id !== taskId);
    const clamped = Math.max(0, Math.min(index, column.length));
    const before = clamped > 0 ? column[clamped - 1].position : undefined;
    const after = clamped < column.length ? column[clamped].position : undefined;
    const position = positionBetween(before, after);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: status as Task['status'], position } : t));
    try {
      await repository.reorder(taskId, status as TaskStatus, position);
    } catch (e) {
      setTasks(prev => prev.map(t => t.id === taskId ? previous : t));
      showTransientError(`No se pudo mover: ${errorMessage(e)}`);
    }
  };

  const viewTasks = filterByView(tasks, view);
  let visibleTasks = tagFilter.length === 0
    ? viewTasks
    : viewTasks.filter(t => t.tags.some(tag => tagFilter.includes(tag.id)));
  if (projectFilter) {
    visibleTasks = visibleTasks.filter(t => String(t.projectId) === projectFilter);
  }

  const grouped = visibleTasks.reduce((acc, task) => {
    const status = task.status || 'PENDING';
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
  Object.values(grouped).forEach(list =>
    list.sort((a, b) => ((a.position ?? 0) - (b.position ?? 0)) || (a.createdAt ?? '').localeCompare(b.createdAt ?? '')));

  const toggleTagFilter = (id: number) => {
    setTagFilter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const countTagTasks = (id: number) => tasks.filter(t => t.tags.some(tag => tag.id === id)).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isLoading = loading || tagsLoading;

  return (
    <div className={styles.page}>
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={dismissError} />}
      {lastDeleted && (
        <div className={styles.undoBar} role="status">
          <span>{t('board.undo')}</span>
          <button type="button" className={styles.newTaskBtn} onClick={handleUndo}>{t('board.undoAction')}</button>
        </div>
      )}
      <header className={styles.header}>
        <h1>{t('app.title')} <span className={styles.count}>{formatNumber(tasks.length, lang)}</span></h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className={styles.searchInput}
            placeholder="Buscar tareas"
            value={query.q ?? ''}
            onChange={e => setQuery(prev => ({ ...prev, q: e.target.value || undefined }))}
          />
          <label className={styles.themeLabel}>
            Vista
            <select
              aria-label="Vista"
              className={styles.themeSelect}
              value={view}
              onChange={e => setView(e.target.value as BoardView)}
            >
              <option value="all">Todas</option>
              <option value="today">Hoy</option>
              <option value="overdue">Vencidas</option>
              <option value="upcoming">Próximas</option>
            </select>
          </label>
          <label className={styles.themeLabel}>
            Proyecto
            <select
              aria-label="Filtrar por proyecto"
              className={styles.themeSelect}
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {projects.map(p => (<option key={p.id} value={String(p.id)}>{p.name}</option>))}
            </select>
          </label>
          <label className={styles.themeLabel}>
            Prioridad
            <select
              aria-label="Prioridad"
              className={styles.themeSelect}
              value={query.priority ?? ''}
              onChange={e => setQuery(prev => ({ ...prev, priority: (e.target.value || undefined) as Priority | undefined }))}
            >
              <option value="">Todas</option>
              <option value={Priority.LOW}>Baja</option>
              <option value={Priority.MEDIUM}>Media</option>
              <option value={Priority.HIGH}>Alta</option>
            </select>
          </label>
          <label className={styles.themeLabel}>
            Ordenar
            <select
              aria-label="Ordenar"
              className={styles.themeSelect}
              value={`${query.sort ?? 'createdAt'}:${query.dir ?? (query.sort && query.sort !== 'createdAt' ? 'asc' : 'desc')}`}
              onChange={e => {
                const [sort, dir] = e.target.value.split(':');
                setQuery(prev => ({ ...prev, sort: sort as TaskSort, dir: dir as SortDir }));
              }}
            >
              <option value="createdAt:desc">Recientes</option>
              <option value="dueDate:asc">Vence pronto</option>
              <option value="priority:desc">Prioridad</option>
              <option value="title:asc">Título</option>
            </select>
          </label>
          <label className={styles.themeLabel}>
            {t('board.language')}
            <select
              aria-label={t('board.language')}
              className={styles.themeSelect}
              value={lang}
              onChange={e => setLang(e.target.value)}
            >
              {AVAILABLE_LANGS.map(l => (<option key={l.code} value={l.code}>{l.label}</option>))}
            </select>
          </label>
          <label className={styles.themeLabel}>
            Tema
            <select
              aria-label="Tema"
              value={theme}
              onChange={e => setTheme(e.target.value as typeof theme)}
              className={styles.themeSelect}
            >
              {AVAILABLE_THEMES.map(t => (
                <option key={t.name} value={t.name}>{t.label}</option>
              ))}
            </select>
          </label>
          <button className={styles.newTaskBtn} onClick={() => { setEditingTask(null); setModalOpen(true); }}>{t('board.newTask')}</button>
          <button className={styles.logoutBtn} onClick={handleLogout}>{t('board.logout')}</button>
        </div>
      </header>

      <div className={styles.filterRow} role="group" aria-label="Filtrar por etiqueta">
        {tags.map(tag => (
          <button
            key={tag.id}
            type="button"
            aria-pressed={tagFilter.includes(tag.id)}
            className={`${styles.filterPill} ${tagFilter.includes(tag.id) ? styles.filterActive : ''}`}
            onClick={() => toggleTagFilter(tag.id)}
          >
            {tag.name}
          </button>
        ))}
        {tagFilter.length > 0 && (
          <button type="button" className={styles.filterClear} onClick={() => setTagFilter([])}>
            Limpiar
          </button>
        )}
      </div>

      <main className={styles.board}>
        {isLoading ? (
          <div role="status" aria-label={t('board.loading')} className={styles.skeletons}>
            {[0, 1, 2].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className={styles.emptyBoard}>
            <p>{t('board.empty')}</p>
            <button className={styles.newTaskBtn} onClick={() => { setEditingTask(null); setModalOpen(true); }}>
              {t('board.create')}
            </button>
          </div>
        ) : (
          Object.entries(COLUMN_CONFIG).map(([status, config]) => (
            <KanbanColumn
              key={status}
              status={status}
              label={config.label}
              tasks={grouped[status] ?? []}
              onCardClick={handleCardClick}
              onReorder={(taskId, index) => handleReorder(taskId, status, index)}
              onDelete={(task) => handleDelete(task.id)}
              onQuickAdd={handleQuickAdd}
              onMove={handleKeyboardMove}
            />
          ))
        )}
      </main>

      {!isLoading && tasks.length > 0 && tasks.length < total && (
        <div style={{ padding: '0.5rem' }}>
          <button className={styles.newTaskBtn} onClick={loadMore}>{t('board.more')}</button>
        </div>
      )}

      <AddTaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSave={handleSave}
        repository={repository}
        existingTags={tags}
        projects={projects}
        editingTask={editingTask}
        countTagTasks={countTagTasks}
        onTagCreated={(tag) => setTags(prev => [...prev, tag])}
        onTagDeleted={(id) => {
          setTags(prev => prev.filter(t => t.id !== id));
          setTasks(prev => prev.map(t => ({ ...t, tags: t.tags.filter(tag => tag.id !== id) })));
          loadTags();
        }}
      />
    </div>
  );
}
