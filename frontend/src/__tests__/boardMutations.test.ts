import { describe, it, expect, vi } from 'vitest';
import { patchTask, replaceTask, removeTask, addTask, runOptimistic } from '../services/boardMutations';
import { Task, TaskStatus, Priority } from '../services/types/task';

const base: Task[] = [
  { id: 1, title: 'A', priority: Priority.LOW, status: TaskStatus.PENDING, tags: [] },
  { id: 2, title: 'B', priority: Priority.LOW, status: TaskStatus.PENDING, tags: [] },
];

describe('task list operations', () => {
  it('patchTask updates one task without mutating the input', () => {
    const next = patchTask(base, 1, { status: TaskStatus.ACTIVE });
    expect(next[0].status).toBe(TaskStatus.ACTIVE);
    expect(next[1]).toBe(base[1]);
    expect(base[0].status).toBe(TaskStatus.PENDING);
  });

  it('replaceTask swaps the task with the given one', () => {
    const updated = { ...base[1], title: 'B2' };
    const next = replaceTask(base, updated);
    expect(next[1].title).toBe('B2');
    expect(next[0]).toBe(base[0]);
  });

  it('removeTask drops the task', () => {
    expect(removeTask(base, 1).map(t => t.id)).toEqual([2]);
  });

  it('addTask appends', () => {
    const extra: Task = { id: 3, title: 'C', priority: Priority.LOW, status: TaskStatus.PENDING, tags: [] };
    expect(addTask(base, extra).map(t => t.id)).toEqual([1, 2, 3]);
  });
});

describe('runOptimistic', () => {
  it('applies, awaits the action and does not roll back on success', async () => {
    const order: string[] = [];
    const action = vi.fn(async () => { order.push('action'); });

    await runOptimistic({
      before: undefined,
      apply: () => order.push('apply'),
      action,
      rollback: () => order.push('rollback'),
    });

    expect(order).toEqual(['apply', 'action']);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('rolls back and surfaces the error when the action rejects', async () => {
    const rollback = vi.fn();
    const onError = vi.fn();

    await runOptimistic({
      before: 'PENDING',
      apply: () => {},
      action: () => Promise.reject(new Error('offline')),
      rollback,
      onError,
    });

    expect(rollback).toHaveBeenCalledWith('PENDING');
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
