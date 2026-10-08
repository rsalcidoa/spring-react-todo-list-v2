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

  it('orders each column by the active field sort, dateless last', async () => {
    const repository = new InMemoryTaskRepository();
    const later = await repository.create({ title: 'Later', priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [], dueDate: '2026-03-01' });
    const sooner = await repository.create({ title: 'Sooner', priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [], dueDate: '2026-01-01' });
    const none = await repository.create({ title: 'None', priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [] });

    const { result } = renderHook(() => useBoard(repository));
    await waitFor(() => expect(result.current.tasks).toHaveLength(3));

    act(() => { result.current.actions.setQuery({ sort: 'dueDate', dir: 'asc' }); });

    await waitFor(() => expect(result.current.grouped.PENDING.map(t => t.id)).toEqual([sooner.id, later.id, none.id]));
  });

  it('keeps manual position ordering when no field sort is active', async () => {
    const repository = new InMemoryTaskRepository();
    const a = await repository.create({ title: 'A', priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [] });
    const b = await repository.create({ title: 'B', priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [] });
    await repository.reorder(b.id, TaskStatus.PENDING, 0);
    await repository.reorder(a.id, TaskStatus.PENDING, 1);

    const { result } = renderHook(() => useBoard(repository));
    await waitFor(() => expect(result.current.tasks).toHaveLength(2));

    await waitFor(() => expect(result.current.grouped.PENDING.map(t => t.id)).toEqual([b.id, a.id]));
  });

  it('scopes the board by project, including tasks without a project', async () => {
    const repository = new InMemoryTaskRepository();
    const project = await repository.createProject('Casa');
    const withProject = await repository.create({ title: 'Con', priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [], projectId: project.id });
    const without = await repository.create({ title: 'Sin', priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [] });

    const { result } = renderHook(() => useBoard(repository));
    await waitFor(() => expect(result.current.tasks).toHaveLength(2));

    act(() => result.current.actions.setProjectFilter('none'));
    await waitFor(() => expect(result.current.grouped.PENDING.map(t => t.id)).toEqual([without.id]));

    act(() => result.current.actions.setProjectFilter(String(project.id)));
    await waitFor(() => expect(result.current.grouped.PENDING.map(t => t.id)).toEqual([withProject.id]));
  });

  it('selects a newly created project', async () => {
    const repository = new InMemoryTaskRepository();
    const { result } = renderHook(() => useBoard(repository));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created: { id: number } = { id: 0 };
    await act(async () => { created = await result.current.actions.createProject('Casa', 'desc'); });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.filters.projectFilter).toBe(String(created.id));
  });

  it('removes the project tasks when deleting a project', async () => {
    const repository = new InMemoryTaskRepository();
    const project = await repository.createProject('Casa');
    const keep = await repository.create({ title: 'Keep', priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [] });
    await repository.create({ title: 'Gone', priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [], projectId: project.id });

    const { result } = renderHook(() => useBoard(repository));
    await waitFor(() => expect(result.current.tasks).toHaveLength(2));

    await act(async () => { await result.current.actions.deleteProject(project.id); });

    await waitFor(() => expect(result.current.tasks.map(t => t.id)).toEqual([keep.id]));
    expect(result.current.projects).toHaveLength(0);
  });
});
