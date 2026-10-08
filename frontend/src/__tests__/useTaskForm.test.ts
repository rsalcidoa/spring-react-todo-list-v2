import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useTaskForm } from '../components/useTaskForm';
import { InMemoryTaskRepository } from '../data/TaskRepository';
import { Priority, TaskStatus, Task } from '../services/types/task';

afterEach(cleanup);

const renderForm = (args: Partial<Parameters<typeof useTaskForm>[0]> = {}) => {
  const repository = new InMemoryTaskRepository();
  const utils = renderHook(() => useTaskForm({ isOpen: true, editingTask: null, repository, ...args }));
  return { repository, ...utils };
};

describe('useTaskForm parsing', () => {
  it('parses recurrence, reminder and project into a TaskInput', () => {
    const { result } = renderForm();

    act(() => result.current.setTitle('Task'));
    act(() => result.current.setRecurrence('WEEKLY'));
    act(() => result.current.setReminderAt('2026-07-01T09:00'));
    act(() => result.current.setProjectId('3'));

    expect(result.current.buildInput()).toMatchObject({
      title: 'Task',
      recurrence: 'WEEKLY',
      reminderAt: '2026-07-01T09:00',
      projectId: 3,
    });
  });

  it('normalizes NONE recurrence, empty reminder and empty project to undefined', () => {
    const { result } = renderForm();

    act(() => result.current.setTitle('Task'));
    act(() => result.current.setRecurrence('NONE'));
    act(() => result.current.setReminderAt(''));
    act(() => result.current.setProjectId(''));

    const input = result.current.buildInput();
    expect(input?.recurrence).toBeUndefined();
    expect(input?.reminderAt).toBeUndefined();
    expect(input?.projectId).toBeUndefined();
  });

  it('blocks a blank title and exposes the error', () => {
    const { result } = renderForm();

    act(() => result.current.setTitle('   '));

    let input: unknown = 'sentinel';
    act(() => { input = result.current.buildInput(); });

    expect(input).toBeNull();
    expect(result.current.titleError).toBeTruthy();
  });

  it('clears the title error when the user edits the title', () => {
    const { result } = renderForm();

    act(() => result.current.setTitle('   '));
    act(() => { result.current.buildInput(); });
    expect(result.current.titleError).toBeTruthy();

    act(() => result.current.setTitle('Task'));
    expect(result.current.titleError).toBeNull();
  });

  it('pre-fills from the editing task, then resets when it becomes null', async () => {
    const repository = new InMemoryTaskRepository();
    const task = await repository.create({
      title: 'Existing', priority: Priority.HIGH, status: TaskStatus.ACTIVE, tagNames: [],
      dueDate: '2026-08-01', reminderAt: '2026-08-01T10:30:00', recurrence: 'DAILY',
    });

    const { result, rerender } = renderHook(
      ({ editingTask }: { editingTask: Task | null }) => useTaskForm({ isOpen: true, editingTask, repository }),
      { initialProps: { editingTask: task as Task | null } },
    );

    await waitFor(() => expect(result.current.values.title).toBe('Existing'));
    expect(result.current.values.reminderAt).toBe('2026-08-01T10:30');
    expect(result.current.values.recurrence).toBe('DAILY');

    rerender({ editingTask: null });
    await waitFor(() => expect(result.current.values.title).toBe(''));
  });
});

describe('useTaskForm tags', () => {
  it('trims and creates a tag through the repository, selecting it', async () => {
    const onTagCreated = vi.fn();
    const { repository, result } = renderForm({ onTagCreated });

    act(() => result.current.setNewTagName('  Work  '));
    await act(async () => { await result.current.createTag(); });

    const tags = await repository.listTags();
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe('Work');
    expect(onTagCreated).toHaveBeenCalledWith(tags[0]);
    expect(result.current.values.tagNames).toContain('Work');
    expect(result.current.newTagName).toBe('');
  });

  it('surfaces a validation error when the tag name is blank', async () => {
    const { result } = renderForm();

    act(() => result.current.setNewTagName('   '));
    await act(async () => { await result.current.createTag(); });

    expect(result.current.tagError?.message).toBeTruthy();
  });

  it('toggles tag selection', () => {
    const { result } = renderForm();

    act(() => result.current.toggleTag('Work'));
    expect(result.current.values.tagNames).toEqual(['Work']);
    act(() => result.current.toggleTag('Work'));
    expect(result.current.values.tagNames).toEqual([]);
  });

  it('deletes an unused tag and notifies the parent', async () => {
    const repository = new InMemoryTaskRepository();
    const tag = await repository.createTag('Work');
    const existingTags = [tag];
    const onTagDeleted = vi.fn();

    const { result } = renderHook(() => useTaskForm({ isOpen: true, editingTask: null, repository, existingTags, onTagDeleted }));
    await act(async () => { await result.current.deleteTag(tag.id); });

    expect(onTagDeleted).toHaveBeenCalledWith(tag.id);
    expect(await repository.listTags()).toHaveLength(0);
  });
});

describe('useTaskForm subtasks', () => {
  it('adds, toggles and removes subtasks through the repository', async () => {
    const repository = new InMemoryTaskRepository();
    const parent = await repository.create({ title: 'Parent', priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [] });

    const { result } = renderHook(() => useTaskForm({ isOpen: true, editingTask: parent, repository }));
    await waitFor(() => expect(result.current.subtasks).toHaveLength(0));

    act(() => result.current.setNewSubtask('Child'));
    await act(async () => { await result.current.addSubtask(); });
    expect(result.current.subtasks.map(s => s.title)).toEqual(['Child']);

    const child = result.current.subtasks[0];
    await act(async () => { await result.current.toggleSubtask(child); });
    expect(result.current.subtasks[0].status).toBe(TaskStatus.COMPLETED);

    await act(async () => { await result.current.deleteSubtask(child.id); });
    expect(result.current.subtasks).toHaveLength(0);
  });
});
