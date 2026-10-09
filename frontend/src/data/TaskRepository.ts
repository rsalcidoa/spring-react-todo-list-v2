import { Task, Tag, Project, TaskInput, TaskQuery, Page, TaskStatus, Priority } from '../services/types/task';
import { applyBoardQuery } from '../services/boardQuery';
import { getTasks, createTask, updateTask, deleteTask, patchStatus, getTags, createTag as apiCreateTag, deleteTag as apiDeleteTag, getProjects, createProject as apiCreateProject, renameProject as apiRenameProject, deleteProject as apiDeleteProject, getSubtasks, reorderPosition, restoreTask } from '../services/ApiService';

/** Role-sized ports: callers depend only on the capability they use. */
export interface TaskStore {
  fetchAll(query?: TaskQuery): Promise<Task[]>;
  fetchPage(query: TaskQuery | undefined, page: number, size: number): Promise<Page<Task>>;
  create(input: TaskInput): Promise<Task>;
  update(id: number, input: TaskInput): Promise<Task>;
  move(id: number, status: TaskStatus): Promise<void>;
  remove(id: number): Promise<void>;
  restore(id: number): Promise<Task>;
}

export interface OrderingStore {
  reorder(id: number, status: TaskStatus, position: number): Promise<void>;
}

export interface TagStore {
  listTags(): Promise<Tag[]>;
  createTag(name: string): Promise<Tag>;
  deleteTag(id: number): Promise<void>;
}

export interface ProjectStore {
  listProjects(): Promise<Project[]>;
  createProject(name: string, description?: string): Promise<Project>;
  renameProject(id: number, name: string, description?: string): Promise<Project>;
  deleteProject(id: number): Promise<void>;
}

export interface SubtaskStore {
  listSubtasks(parentId: number): Promise<Task[]>;
  createSubtask(parentId: number, title: string): Promise<Task>;
  removeSubtask(id: number): Promise<void>;
}

/** Composite port for callers that need the whole board (e.g. the page). */
export interface TaskRepository extends TaskStore, OrderingStore, TagStore, ProjectStore, SubtaskStore {}

export type RepositoryErrorCode = 'conflict' | 'unauthorized' | 'forbidden' | 'not-found' | 'validation' | 'unknown';

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  readonly status?: number;
  readonly detail?: string;

  constructor(code: RepositoryErrorCode, detail?: string, status?: number) {
    super(detail ?? code);
    this.name = 'RepositoryError';
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

/** Single interpretation of the HTTP contract, shared by page and modal. */
function getApiStatus(e: unknown): number | undefined {
  return (e as { response?: { status?: number } }).response?.status;
}

function getApiDetail(e: unknown): string | undefined {
  const err = e as { response?: { data?: { error?: string } }; message?: string };
  const backend = err.response?.data?.error;
  if (backend) return backend;
  return typeof err.message === 'string' && err.message ? err.message : undefined;
}

export function mapApiError(e: unknown): RepositoryError {
  if (e instanceof RepositoryError) return e;
  const status = getApiStatus(e);
  const detail = getApiDetail(e);
  if (status === 409) return new RepositoryError('conflict', detail, status);
  if (status === 401) return new RepositoryError('unauthorized', detail, status);
  if (status === 403) return new RepositoryError('forbidden', detail, status);
  if (status === 404) return new RepositoryError('not-found', detail, status);
  if (status === 400) return new RepositoryError('validation', detail, status);
  return new RepositoryError('unknown', detail, status);
}

const normalizeKey = (name: string): string => name.trim().toLowerCase();

function normalizeDescription(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function checkTagName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new RepositoryError('validation', 'Tag name must not be blank');
  if (trimmed.length > 50) throw new RepositoryError('validation', 'Tag name must not exceed 50 characters');
  return trimmed;
}

interface WireTaskBody {
  title: string;
  description?: string;
  priority: Task['priority'];
  status: TaskStatus;
  dueDate?: string;
  reminderAt?: string;
  recurrence?: string;
  projectId?: number;
  parentId?: number;
  tagNames: string[];
}

function toWire(input: TaskInput): WireTaskBody {
  const wire: WireTaskBody = {
    title: input.title,
    priority: input.priority,
    status: input.status,
    tagNames: [...input.tagNames],
  };
  if (input.description) {
    wire.description = input.description;
  }
  if (input.dueDate) {
    wire.dueDate = input.dueDate;
  }
  if (input.reminderAt) {
    wire.reminderAt = input.reminderAt;
  }
  if (input.recurrence) {
    wire.recurrence = input.recurrence;
  }
  if (input.projectId != null) {
    wire.projectId = input.projectId;
  }
  if (input.parentId != null) {
    wire.parentId = input.parentId;
  }
  return wire;
}

function fromWire(wire: Partial<Task> & { id?: number }): Task {
  return {
    id: wire.id ?? 0,
    title: wire.title ?? '',
    description: wire.description,
    priority: wire.priority ?? Priority.LOW,
    dueDate: wire.dueDate,
    status: wire.status ?? TaskStatus.PENDING,
    tags: Array.isArray(wire.tags) ? wire.tags : [],
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
    reminderAt: wire.reminderAt,
    recurrence: wire.recurrence,
    projectId: wire.projectId,
    projectName: wire.projectName,
    parentId: wire.parentId,
    subtaskProgress: wire.subtaskProgress,
    position: wire.position,
  };
}

export class HttpTaskRepository implements TaskRepository {
  async fetchAll(query?: TaskQuery): Promise<Task[]> {
    try {
      const r = await getTasks(query);
      return (r.data ?? []).map(fromWire);
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async fetchPage(query: TaskQuery | undefined, page: number, size: number): Promise<Page<Task>> {
    try {
      const r = await getTasks(query, page, size);
      const data = r.data ?? {};
      return {
        items: Array.isArray(data.items) ? data.items.map(fromWire) : [],
        page: data.page ?? page,
        size: data.size ?? size,
        total: data.total ?? 0,
      };
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async create(input: TaskInput): Promise<Task> {
    try {
      const r = await createTask(toWire(input));
      return fromWire(r.data);
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async update(id: number, input: TaskInput): Promise<Task> {
    try {
      const r = await updateTask(id, toWire(input));
      return fromWire(r.data);
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async move(id: number, status: TaskStatus): Promise<void> {
    try {
      await patchStatus(id, status);
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await deleteTask(id);
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async listTags(): Promise<Tag[]> {
    try {
      const r = await getTags();
      return Array.isArray(r.data) ? [...r.data] : [];
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async createTag(name: string): Promise<Tag> {
    try {
      const r = await apiCreateTag(name.trim());
      return r.data as Tag;
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async deleteTag(id: number): Promise<void> {
    try {
      await apiDeleteTag(id);
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async listProjects(): Promise<Project[]> {
    try {
      const r = await getProjects();
      return Array.isArray(r.data) ? [...r.data] : [];
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async createProject(name: string, description?: string): Promise<Project> {
    try {
      const r = await apiCreateProject(name.trim(), description);
      return r.data as Project;
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async renameProject(id: number, name: string, description?: string): Promise<Project> {
    try {
      const r = await apiRenameProject(id, name.trim(), description);
      return r.data as Project;
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async deleteProject(id: number): Promise<void> {
    try {
      await apiDeleteProject(id);
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async listSubtasks(parentId: number): Promise<Task[]> {
    try {
      const r = await getSubtasks(parentId);
      return (r.data ?? []).map(fromWire);
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async createSubtask(parentId: number, title: string): Promise<Task> {
    return this.create({ title, priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [], parentId });
  }

  async removeSubtask(id: number): Promise<void> {
    return this.remove(id);
  }

  async reorder(id: number, status: TaskStatus, position: number): Promise<void> {
    try {
      await reorderPosition(id, status, position);
    } catch (e) {
      throw mapApiError(e);
    }
  }

  async restore(id: number): Promise<Task> {
    try {
      const r = await restoreTask(id);
      return fromWire(r.data);
    } catch (e) {
      throw mapApiError(e);
    }
  }
}

export class InMemoryTaskRepository implements TaskRepository {
  private tasks: Task[] = [];
  private deleted: Task[] = [];
  private tags: Tag[] = [];
  private projects: Project[] = [];
  private nextTaskId = 1;
  private nextTagId = 1;
  private nextProjectId = 1;

  async fetchAll(query?: TaskQuery): Promise<Task[]> {
    const items = applyBoardQuery(
      this.tasks.map(t => ({ ...t, tags: [...t.tags] })),
      {
        q: query?.q,
        priority: query?.priority,
        status: query?.status,
        tagIds: query?.tagIds,
        sort: query?.sort,
        dir: query?.dir,
      },
    );
    return items.map(t => {
      const children = this.tasks.filter(c => c.parentId === t.id);
      if (children.length === 0) return t;
      const done = children.filter(c => c.status === TaskStatus.COMPLETED).length;
      return { ...t, subtaskProgress: { done, total: children.length } };
    });
  }

  async fetchPage(query: TaskQuery | undefined, page: number, size: number): Promise<Page<Task>> {
    const all = await this.fetchAll(query);
    const start = page * size;
    return { items: all.slice(start, start + size), page, size, total: all.length };
  }

  async create(input: TaskInput): Promise<Task> {
    this.requireValidParent(input.parentId);
    const tags = this.registerTags(input.tagNames);
    const task: Task = {
      id: this.nextTaskId++,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      dueDate: input.dueDate,
      reminderAt: input.reminderAt,
      recurrence: input.recurrence,
      projectId: input.projectId,
      projectName: input.projectId != null ? this.projects.find(p => p.id === input.projectId)?.name : undefined,
      parentId: input.parentId,
      tags: [...tags],
    };
    this.tasks.push(task);
    return { ...task, tags: [...task.tags] };
  }

  async update(id: number, input: TaskInput): Promise<Task> {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) throw new RepositoryError('not-found', `Task ${id} not found`);
    const tags = this.registerTags(input.tagNames);
    this.tasks[index] = {
      ...this.tasks[index],
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      dueDate: input.dueDate,
      reminderAt: input.reminderAt,
      recurrence: input.recurrence,
      projectId: input.projectId,
      projectName: input.projectId != null ? this.projects.find(p => p.id === input.projectId)?.name : undefined,
      parentId: input.parentId,
      tags: [...tags],
    };
    return { ...this.tasks[index], tags: [...this.tasks[index].tags] };
  }

  async move(id: number, status: TaskStatus): Promise<void> {
    const task = this.tasks.find(t => t.id === id);
    if (!task) throw new RepositoryError('not-found', `Task ${id} not found`);
    task.status = status;
  }

  async remove(id: number): Promise<void> {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) throw new RepositoryError('not-found', `Task ${id} not found`);
    const [task] = this.tasks.splice(index, 1);
    this.deleted.push(task);
  }

  async restore(id: number): Promise<Task> {
    const index = this.deleted.findIndex(t => t.id === id);
    if (index === -1) throw new RepositoryError('not-found', `Task ${id} not found`);
    const [task] = this.deleted.splice(index, 1);
    this.tasks.push(task);
    return { ...task, tags: [...task.tags] };
  }

  async listTags(): Promise<Tag[]> {
    return [...this.tags];
  }

  async createTag(name: string): Promise<Tag> {
    const trimmed = checkTagName(name);
    const key = normalizeKey(trimmed);
    const existing = this.tags.find(t => normalizeKey(t.name) === key);
    if (existing) throw new RepositoryError('conflict', 'Tag already exists');
    const tag: Tag = { id: this.nextTagId++, name: trimmed };
    this.tags.push(tag);
    return { ...tag };
  }

  async deleteTag(id: number): Promise<void> {
    const index = this.tags.findIndex(t => t.id === id);
    if (index === -1) throw new RepositoryError('not-found', `Tag ${id} not found`);
    this.tags.splice(index, 1);
    for (const task of this.tasks) {
      task.tags = task.tags.filter(t => t.id !== id);
    }
  }

  async listProjects(): Promise<Project[]> {
    return [...this.projects].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  }

  async createProject(name: string, description?: string): Promise<Project> {
    const trimmed = name.trim();
    if (!trimmed) throw new RepositoryError('validation', 'Name must not be blank');
    if (trimmed.length > 50) throw new RepositoryError('validation', 'Name must not exceed 50 characters');
    const key = trimmed.toLowerCase();
    if (this.projects.some(p => p.name.toLowerCase() === key)) {
      throw new RepositoryError('conflict', 'Project already exists');
    }
    const project: Project = { id: this.nextProjectId++, name: trimmed, description: normalizeDescription(description) };
    this.projects.push(project);
    return { ...project };
  }

  async renameProject(id: number, name: string, description?: string): Promise<Project> {
    const project = this.projects.find(p => p.id === id);
    if (!project) throw new RepositoryError('not-found', `Project ${id} not found`);
    const trimmed = name.trim();
    const key = trimmed.toLowerCase();
    if (this.projects.some(p => p.id !== id && p.name.toLowerCase() === key)) {
      throw new RepositoryError('conflict', 'Project already exists');
    }
    project.name = trimmed;
    project.description = normalizeDescription(description);
    for (const task of this.tasks) {
      if (task.projectId === id) task.projectName = trimmed;
    }
    return { ...project };
  }

  async deleteProject(id: number): Promise<void> {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) throw new RepositoryError('not-found', `Project ${id} not found`);
    this.projects.splice(index, 1);
    const removed = new Set(this.tasks.filter(t => t.projectId === id).map(t => t.id));
    this.tasks = this.tasks.filter(t => t.projectId !== id && !(t.parentId != null && removed.has(t.parentId)));
  }

  async listSubtasks(parentId: number): Promise<Task[]> {
    if (!this.tasks.some(t => t.id === parentId)) {
      throw new RepositoryError('not-found', `Task ${parentId} not found`);
    }
    return this.tasks.filter(t => t.parentId === parentId).map(t => ({ ...t, tags: [...t.tags] }));
  }

  async createSubtask(parentId: number, title: string): Promise<Task> {
    return this.create({ title, priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [], parentId });
  }

  async removeSubtask(id: number): Promise<void> {
    return this.remove(id);
  }

  /** Backend rule: a parent must exist and may not itself be a subtask. */
  private requireValidParent(parentId?: number): void {
    if (parentId == null) return;
    const parent = this.tasks.find(t => t.id === parentId);
    if (!parent) throw new RepositoryError('validation', `Parent ${parentId} not found`);
    if (parent.parentId != null) throw new RepositoryError('validation', 'Subtasks cannot be nested');
  }

  async reorder(id: number, status: TaskStatus, position: number): Promise<void> {
    const task = this.tasks.find(t => t.id === id);
    if (!task) throw new RepositoryError('not-found', `Task ${id} not found`);
    task.status = status;
    task.position = position;
  }

  private registerTags(names: string[]): Tag[] {
    const seen = new Set<string>();
    const result: Tag[] = [];
    for (const raw of names) {
      const trimmed = checkTagName(raw);
      const key = normalizeKey(trimmed);
      if (seen.has(key)) continue;
      seen.add(key);
      let tag = this.tags.find(t => normalizeKey(t.name) === key);
      if (!tag) {
        tag = { id: this.nextTagId++, name: trimmed };
        this.tags.push(tag);
      }
      result.push(tag);
    }
    return result;
  }
}
