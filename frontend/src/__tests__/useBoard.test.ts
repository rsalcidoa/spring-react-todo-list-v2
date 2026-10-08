import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useBoard } from '../pages/useBoard';
import { InMemoryTaskRepository } from '../data/TaskRepository';
import { Priority, TaskStatus } from '../services/types/task';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useBoard (optimistic board controller seam)', () => {
  it('applies the optimistic move, then rolls back when the repository fails', async () => {
    const repository = new InMemoryTaskRepository();
    const task = await repository.create({
      title: 'Alpha', priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [],
    });

    let rejectMove: (e: unknown) => void = () => {};
    vi.spyOn(repository, 'move').mockImplementationOnce(
      () => new Promise<void>((_resolve, reject) => { rejectMove = reject; }),
    );

    const { result } = renderHook(() => useBoard(repository));
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));

    act(() => { void result.current.actions.move(task.id, TaskStatus.ACTIVE); });
    await waitFor(() => expect(result.current.tasks[0].status).toBe(TaskStatus.ACTIVE));

    await act(async () => { rejectMove(new Error('offline')); });

    await waitFor(() => expect(result.current.tasks[0].status).toBe(TaskStatus.PENDING));
    expect(result.current.error?.message).toMatch(/offline/);
  });

  it('restores a deleted task through undo and clears the undo offer', async () => {
    const repository = new InMemoryTaskRepository();
    const task = await repository.create({
      title: 'Alpha', priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [],
    });

    const { result } = renderHook(() => useBoard(repository));
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));

    await act(async () => { await result.current.actions.delete(task.id); });
    await waitFor(() => expect(result.current.tasks).toHaveLength(0));
    expect(result.current.lastDeleted?.id).toBe(task.id);

    await act(async () => { await result.current.actions.undo(); });
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
    expect(result.current.tasks[0].id).toBe(task.id);
    expect(result.current.lastDeleted).toBeNull();
  });

  it('appends the next page when loadMore is called', async () => {
    const repository = new InMemoryTaskRepository();
    for (let i = 0; i < 21; i++) {
      await repository.create({
        title: 'Task ' + i, priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [],
      });
    }

    const { result } = renderHook(() => useBoard(repository));
    await waitFor(() => expect(result.current.tasks).toHaveLength(20));

    await act(async () => { await result.current.actions.loadMore(); });
    await waitFor(() => expect(result.current.tasks).toHaveLength(21));
  });
});
