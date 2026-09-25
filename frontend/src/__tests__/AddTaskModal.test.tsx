import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AddTaskModal from '../components/AddTaskModal';
import { TaskInput, Tag, Priority, TaskStatus } from '../services/types/task';

afterEach(cleanup);

const mockTags: Tag[] = [
  { id: 1, name: 'Work' },
  { id: 2, name: 'Personal' },
];

describe('AddTaskModal', () => {
  it('renders the modal when isOpen is true', () => {
    render(
      <AddTaskModal
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        existingTags={mockTags}
      />,
    );
    expect(screen.getByText(/Add Task/i)).toBeTruthy();
  });

  it('does not render when isOpen is false', () => {
    render(
      <AddTaskModal
        isOpen={false}
        onClose={() => {}}
        onSave={() => {}}
        existingTags={mockTags}
      />,
    );
    expect(screen.queryByText(/Add Task/i)).toBeNull();
  });

  it('calls onSave with a TaskInput containing tagNames as string[]', () => {
    const onSave = vi.fn();
    render(
      <AddTaskModal
        isOpen={true}
        onClose={() => {}}
        onSave={onSave}
        existingTags={mockTags}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter task title/), {
      target: { value: 'My Task' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const input = onSave.mock.calls[0][0] as TaskInput;
    expect(input.title).toBe('My Task');
    expect(Array.isArray(input.tagNames)).toBe(true);
    expect(input.priority).toBe(Priority.LOW);
    expect(input.status).toBe(TaskStatus.PENDING);
  });

  it('calls onClose after onSave', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    render(
      <AddTaskModal
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
        existingTags={mockTags}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter task title/), {
      target: { value: 'Close Test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('toggles tag pills on click', () => {
    const onSave = vi.fn();
    render(
      <AddTaskModal
        isOpen={true}
        onClose={() => {}}
        onSave={onSave}
        existingTags={mockTags}
      />,
    );

    const workPill = screen.getByText('Work');
    fireEvent.click(workPill);

    const personalPill = screen.getByText('Personal');
    fireEvent.click(personalPill);

    fireEvent.change(screen.getByPlaceholderText(/Enter task title/), {
      target: { value: 'Tagged' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    const input = onSave.mock.calls[0][0] as TaskInput;
    expect(input.tagNames).toEqual(['Work', 'Personal']);
  });

  it('deselects a tag pill when clicked again', () => {
    const onSave = vi.fn();
    render(
      <AddTaskModal
        isOpen={true}
        onClose={() => {}}
        onSave={onSave}
        existingTags={mockTags}
      />,
    );

    const workPill = screen.getByText('Work');
    fireEvent.click(workPill);
    fireEvent.click(workPill);

    fireEvent.change(screen.getByPlaceholderText(/Enter task title/), {
      target: { value: 'No Tags' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    const input = onSave.mock.calls[0][0] as TaskInput;
    expect(input.tagNames).toEqual([]);
  });

  it('shows "Edit Task" header when editingTask is provided', () => {
    render(
      <AddTaskModal
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        existingTags={mockTags}
        editingTask={{
          id: 1,
          title: 'Existing',
          priority: Priority.HIGH,
          status: TaskStatus.ACTIVE,
          tags: [{ id: 1, name: 'Work' }],
        }}
      />,
    );
    expect(screen.getByText(/Edit Task/i)).toBeTruthy();
  });

  it('pre-fills form fields from editingTask', () => {
    render(
      <AddTaskModal
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        existingTags={mockTags}
        editingTask={{
          id: 1,
          title: 'Existing Title',
          description: 'Existing Desc',
          priority: Priority.HIGH,
          status: TaskStatus.ACTIVE,
          tags: [{ id: 1, name: 'Work' }],
        }}
      />,
    );

    const titleInput = screen.getByPlaceholderText(/Enter task title/) as HTMLInputElement;
    expect(titleInput.value).toBe('Existing Title');
  });
});
