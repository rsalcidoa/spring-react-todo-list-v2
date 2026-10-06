import { Task, Tag, TaskInput, TaskQuery, TaskStatus, Priority } from '../services/types/task';
import { getTasks, createTask, updateTask, deleteTask, patchStatus, getTags, createTag as apiCreateTag, deleteTag as apiDeleteTag } from '../services/ApiService';

export interface TaskRepository {
  fetchAll(query?: TaskQuery): Promise<Task[]>;
  create(input: TaskInput): Promise<Task>;
  update(id: number, input: TaskInput): Promise<Task>;
  move(id: number, status: TaskStatus): Promise<void>;
  remove(id: number): Promise<void>;
  listTags(): Promise<Tag[]>;
  createTag(name: string): Promise<Tag>;
  deleteTag(id: number): Promise<void>;
}

export type RepositoryErrorCode = 'conflict' | 'not-found' | 'validation' | 'unknown';

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  readonly status?: number;

  constructor(code: RepositoryErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
    this.status = status;
  }
}

/** Single interpretation of the HTTP contract, shared by page and modal. */
export function getApiStatus(e: unknown): number | undefined {
  return (e as { response?: { status?: number } }).response?.status;
}

export function getApiMessage(e: unknown): string {
  const err = e as { response?: { data?: { error?: string } }; message?: string };
  return err.response?.data?.error || err.message || 'Error';
}

export function mapApiError(e: unknown): RepositoryError {
  if (e instanceof RepositoryError) return e;
  const status = getApiStatus(e);
  const detail = getApiMessage(e);
  if (status === 409) return new RepositoryError('conflict', detail, status);
  if (status === 404) return new RepositoryError('not-found', detail, status);
  if (status === 400) return new RepositoryError('validation', detail, status);
  return new RepositoryError('unknown', detail, status);
}

export function toDisplayMessage(
  e: unknown,
  fallbacks: { conflict?: string; badRequest?: string; notFound?: string } = {},
): string {
  const err = mapApiError(e);
  switch (err.code) {
    case 'conflict':
      return fallbacks.conflict ?? err.message;
    case 'validation':
      return fallbacks.badRequest ?? err.message;
    case 'not-found':
      return fallbacks.notFound ?? err.message;
    default:
      return err.message;
  }
}

const normalizeKey = (name: string): string => name.trim().toLowerCase();

function checkTagName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new RepositoryError('validation', 'Tag name must not be blank');
  if (trimmed.length > 50) throw new RepositoryError('validation', 'Tag name must not exceed 50 characters');
  return trimmed;
}

const PRIORITY_RANK: Record<Priority, number> = {
  [Priority.LOW]: 0,
  [Priority.MEDIUM]: 1,
  [Priority.HIGH]: 2,
};

function compareTasks(a: Task, b: Task, sort: TaskQuery['sort'], dir: TaskQuery['dir']): number {
  const field = sort ?? 'createdAt';
  const direction = dir ?? (field === 'createdAt' ? 'desc' : 'asc');
  let result: number;
  switch (field) {
    case 'priority':
      result = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      break;
    case 'title':
      result = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      break;
    case 'dueDate': {
      const ad = a.dueDate;
      const bd = b.dueDate;
      if (!ad && !bd) return 0;
      if (!ad) return 1; // dateless tasks last, regardless of direction
      if (!bd) return -1;
      result = ad.localeCompare(bd);
      break;
    }
    default:
      result = (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
  }
  return direction === 'desc' ? -result : result;
}

interface WireTaskBody {
  title: string;
  description?: string;
  priority: Task['priority'];
  status: TaskStatus;
  dueDate?: string;
  reminderAt?: string;
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
}

export class InMemoryTaskRepository implements TaskRepository {
  private tasks: Task[] = [];
  private tags: Tag[] = [];
  private nextTaskId = 1;
  private nextTagId = 1;

  async fetchAll(query?: TaskQuery): Promise<Task[]> {
    let items = this.tasks.map(t => ({ ...t, tags: [...t.tags] }));
    if (query?.q) {
      const needle = query.q.toLowerCase();
      items = items.filter(t =>
        t.title.toLowerCase().includes(needle) || (t.description ?? '').toLowerCase().includes(needle));
    }
    if (query?.priority) {
      items = items.filter(t => t.priority === query.priority);
    }
    if (query?.status) {
      items = items.filter(t => t.status === query.status);
    }
    if (query?.tagIds && query.tagIds.length > 0) {
      items = items.filter(t => t.tags.some(tag => query.tagIds!.includes(tag.id)));
    }
    const sort = query?.sort ?? 'createdAt';
    const dir = query?.dir ?? (sort === 'createdAt' ? 'desc' : 'asc');
    return items.sort((a, b) => compareTasks(a, b, sort, dir));
  }

  async create(input: TaskInput): Promise<Task> {
    const tags = this.registerTags(input.tagNames);
    const task: Task = {
      id: this.nextTaskId++,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      dueDate: input.dueDate,
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
    this.tasks.splice(index, 1);
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
