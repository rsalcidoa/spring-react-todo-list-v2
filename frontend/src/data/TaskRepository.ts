import { Task, Tag, TaskInput, TaskStatus, Priority } from '../services/types/task';
import { getTasks, createTask, updateTask, deleteTask, patchStatus, getTags, api } from '../services/ApiService';

export interface TaskRepository {
  fetchAll(): Promise<Task[]>;
  create(input: TaskInput): Promise<Task>;
  update(id: number, input: TaskInput): Promise<void>;
  move(id: number, status: TaskStatus): Promise<void>;
  remove(id: number): Promise<void>;
  listTags(): Promise<Tag[]>;
}

export interface ApiClient {
  getTasks(): Promise<{ data?: Task[] }>;
  createTask(body: WireTaskBody): Promise<{ data: Task }>;
  updateTask(id: number, body: WireTaskBody): Promise<unknown>;
  deleteTask(id: number): Promise<unknown>;
  patchStatus(id: number, status: string): Promise<unknown>;
  getTags(): Promise<{ data?: Tag[] }>;
}

interface WireTaskBody {
  title: string;
  description?: string;
  priority: Priority;
  status?: TaskStatus;
  dueDate?: string;
  tagNames: string[];
}

export function toWire(input: TaskInput): WireTaskBody {
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
  return wire;
}

export function fromWire(wire: Partial<Task> & { id?: number }): Task {
  return {
    id: wire.id ?? 0,
    title: wire.title ?? '',
    description: wire.description,
    priority: (wire.priority as Priority) ?? Priority.LOW,
    dueDate: wire.dueDate,
    status: (wire.status as TaskStatus) ?? TaskStatus.PENDING,
    tags: Array.isArray(wire.tags) ? wire.tags : [],
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
  };
}

class DefaultClient implements ApiClient {
  async getTasks() {
    return getTasks();
  }
  async createTask(body: WireTaskBody) {
    return createTask(body);
  }
  async updateTask(id: number, body: WireTaskBody) {
    return updateTask(id, body);
  }
  async deleteTask(id: number) {
    return deleteTask(id);
  }
  async patchStatus(id: number, status: string) {
    return patchStatus(id, status);
  }
  async getTags() {
    return getTags();
  }
}

export class HttpTaskRepository implements TaskRepository {
  private readonly client: ApiClient;

  constructor(client?: ApiClient) {
    this.client = client ?? new DefaultClient();
  }

  async fetchAll(): Promise<Task[]> {
    const r = await this.client.getTasks();
    return (r.data ?? []).map(fromWire);
  }

  async create(input: TaskInput): Promise<Task> {
    const r = await this.client.createTask(toWire(input));
    return fromWire(r.data);
  }

  async update(id: number, input: TaskInput): Promise<void> {
    await this.client.updateTask(id, toWire(input));
  }

  async move(id: number, status: TaskStatus): Promise<void> {
    await this.client.patchStatus(id, status);
  }

  async remove(id: number): Promise<void> {
    await this.client.deleteTask(id);
  }

  async listTags(): Promise<Tag[]> {
    const r = await this.client.getTags();
    return Array.isArray(r.data) ? r.data : [];
  }
}

export class InMemoryTaskRepository implements TaskRepository {
  private tasks: Task[] = [];
  private tags: Tag[] = [];
  private nextTaskId = 1;
  private nextTagId = 1;

  async fetchAll(): Promise<Task[]> {
    return [...this.tasks];
  }

  async create(input: TaskInput): Promise<Task> {
    const tagNames = this.registerTags(input.tagNames);
    const task: Task = {
      id: this.nextTaskId++,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      dueDate: input.dueDate,
      tags: tagNames.map(name => this.tags.find(t => t.name === name)!),
    };
    this.tasks.push(task);
    return { ...task };
  }

  async update(id: number, input: TaskInput): Promise<void> {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error(`Task ${id} not found`);
    const tagNames = this.registerTags(input.tagNames);
    this.tasks[index] = {
      ...this.tasks[index],
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      dueDate: input.dueDate,
      tags: tagNames.map(name => this.tags.find(t => t.name === name)!),
    };
  }

  async move(id: number, status: TaskStatus): Promise<void> {
    const task = this.tasks.find(t => t.id === id);
    if (task) task.status = status;
  }

  async remove(id: number): Promise<void> {
    this.tasks = this.tasks.filter(t => t.id !== id);
  }

  async listTags(): Promise<Tag[]> {
    return [...this.tags];
  }

  private registerTags(names: string[]): string[] {
    const unique = [...new Set(names)];
    for (const name of unique) {
      if (!this.tags.some(t => t.name === name)) {
        this.tags.push({ id: this.nextTagId++, name });
      }
    }
    return unique;
  }
}
