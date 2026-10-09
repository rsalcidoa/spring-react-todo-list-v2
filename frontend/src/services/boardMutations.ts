import type { Task } from './types/task';

/** Pure task-list updates for the board controller. */

export function patchTask(tasks: Task[], id: number, patch: Partial<Task>): Task[] {
  return tasks.map(task => task.id === id ? { ...task, ...patch } : task);
}

export function replaceTask(tasks: Task[], task: Task): Task[] {
  return tasks.map(current => current.id === task.id ? task : current);
}

export function removeTask(tasks: Task[], id: number): Task[] {
  return tasks.filter(task => task.id !== id);
}

export function addTask(tasks: Task[], task: Task): Task[] {
  return [...tasks, task];
}

export interface OptimisticUpdate<T> {
  /** Snapshot handed back to `rollback` when the action fails. */
  before: T;
  /** Applies the optimistic change locally. */
  apply: () => void;
  /** The repository call whose failure triggers the rollback. */
  action: () => Promise<unknown>;
  /** Restores the snapshot after a failure. */
  rollback: (before: T) => void;
  /** Surfaces the failure after the rollback. */
  onError?: (error: unknown) => void;
  /** Reconciles the local state with the server result after success. */
  onSuccess?: (result: unknown) => void;
}

/**
 * Runs an optimistic update: apply the local change, await the action, and roll
 * back (then surface the error) if the action rejects.
 */
export async function runOptimistic<T>(update: OptimisticUpdate<T>): Promise<void> {
  update.apply();
  try {
    const result = await update.action();
    update.onSuccess?.(result);
  } catch (error) {
    update.rollback(update.before);
    update.onError?.(error);
  }
}
