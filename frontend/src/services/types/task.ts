export interface Tag {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  name: string;
}

export enum TaskStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export type ColumnName = 'PENDING' | 'ACTIVE' | 'COMPLETED';

export type Recurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  status: TaskStatus;
  tags: Tag[];
  createdAt?: string;
  updatedAt?: string;
  reminderAt?: string;
  recurrence?: Recurrence;
  projectId?: number;
  projectName?: string;
  parentId?: number;
  subtaskProgress?: { done: number; total: number };
}

export interface TaskInput {
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  tagNames: string[];
  reminderAt?: string;
  recurrence?: Recurrence;
  projectId?: number;
  parentId?: number;
}

export type TaskSort = 'createdAt' | 'dueDate' | 'priority' | 'title';
export type SortDir = 'asc' | 'desc';

export interface TaskQuery {
  status?: TaskStatus;
  q?: string;
  priority?: Priority;
  tagIds?: number[];
  sort?: TaskSort;
  dir?: SortDir;
}

