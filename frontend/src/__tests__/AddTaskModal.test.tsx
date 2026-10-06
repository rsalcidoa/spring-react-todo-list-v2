import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import AddTaskModal from '../components/AddTaskModal';
import { TaskInput, Tag, Priority, TaskStatus } from '../services/types/task';
import { InMemoryTaskRepository } from '../data/TaskRepository';

afterEach(cleanup);

const mockTags: Tag[] = [
  { id: 1, name: 'Work' },
  { id: 2, name: 'Personal' },
];

function renderModal(props: Partial<React.ComponentProps<typeof AddTaskModal>> = {}) {
  const repository = new InMemoryTaskRepository();
  const utils = render(
    <AddTaskModal
      isOpen={true}
      onClose={() => {}}
      onSave={() => {}}
      repository={repository}
      existingTags={mockTags}
      {...props}
    />,
  );
  return { repository, ...utils };
}

describe('AddTaskModal', () => {
  it('renders the modal when isOpen is true', () => {
    renderModal();
    expect(screen.getByText(/Nueva tarea/i)).toBeTruthy();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('focuses the title field on open', () => {
    renderModal();

    const title = screen.getByPlaceholderText(/Título de la tarea/i) as HTMLInputElement;
    expect(document.activeElement).toBe(title);
  });

  it('does not render when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText(/Nueva tarea/i)).toBeNull();
  });

  it('calls onSave with a TaskInput containing tagNames as string[]', () => {
    const onSave = vi.fn();
    renderModal({ onSave });

    fireEvent.change(screen.getByPlaceholderText(/Título de la tarea/), {
      target: { value: 'My Task' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const input = onSave.mock.calls[0][0] as TaskInput;
    expect(input.title).toBe('My Task');
    expect(Array.isArray(input.tagNames)).toBe(true);
    expect(input.priority).toBe(Priority.LOW);
    expect(input.status).toBe(TaskStatus.PENDING);
  });

  it('blocks save with an inline message when the title is empty', () => {
    const onSave = vi.fn();
    renderModal({ onSave });

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('El título es obligatorio')).toBeTruthy();
  });

  it('asks for confirmation naming the impact when deleting a used tag', async () => {
    const onTagDeleted = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { repository } = renderModal({ onTagDeleted, countTagTasks: () => 2 });
    await repository.createTag('Work');

    fireEvent.click(screen.getByRole('button', { name: /Borrar etiqueta Work/i }));

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('2'));
    expect(onTagDeleted).not.toHaveBeenCalled();
    expect(await repository.listTags()).toHaveLength(1);
    confirmSpy.mockRestore();
  });

  it('deletes without confirmation when the tag is unused', async () => {
    const onTagDeleted = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm');
    const { repository } = renderModal({ onTagDeleted, countTagTasks: () => 0 });
    const created = await repository.createTag('Work');

    fireEvent.click(screen.getByRole('button', { name: /Borrar etiqueta Work/i }));

    await waitFor(() => expect(onTagDeleted).toHaveBeenCalledWith(created.id));
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('calls onClose after onSave', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    renderModal({ onClose, onSave });

    fireEvent.change(screen.getByPlaceholderText(/Título de la tarea/), {
      target: { value: 'Close Test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('toggles tag pills on click', () => {
    const onSave = vi.fn();
    renderModal({ onSave });

    const workPill = screen.getByText('Work');
    fireEvent.click(workPill);

    const personalPill = screen.getByText('Personal');
    fireEvent.click(personalPill);

    fireEvent.change(screen.getByPlaceholderText(/Título de la tarea/), {
      target: { value: 'Tagged' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    const input = onSave.mock.calls[0][0] as TaskInput;
    expect(input.tagNames).toEqual(['Work', 'Personal']);
  });

  it('deselects a tag pill when clicked again', () => {
    const onSave = vi.fn();
    renderModal({ onSave });

    const workPill = screen.getByText('Work');
    fireEvent.click(workPill);
    fireEvent.click(workPill);

    fireEvent.change(screen.getByPlaceholderText(/Título de la tarea/), {
      target: { value: 'No Tags' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    const input = onSave.mock.calls[0][0] as TaskInput;
    expect(input.tagNames).toEqual([]);
  });

  it('shows "Edit Task" header when editingTask is provided', () => {
    renderModal({
      editingTask: {
        id: 1,
        title: 'Existing',
        priority: Priority.HIGH,
        status: TaskStatus.ACTIVE,
        tags: [{ id: 1, name: 'Work' }],
      },
    });
    expect(screen.getByText(/Editar tarea/i)).toBeTruthy();
  });

  it('pre-fills form fields from editingTask', () => {
    renderModal({
      editingTask: {
        id: 1,
        title: 'Existing Title',
        description: 'Existing Desc',
        priority: Priority.HIGH,
        status: TaskStatus.ACTIVE,
        tags: [{ id: 1, name: 'Work' }],
      },
    });

    const titleInput = screen.getByPlaceholderText(/Título de la tarea/) as HTMLInputElement;
    expect(titleInput.value).toBe('Existing Title');
  });

  it('disables status select when creating a new task', () => {
    renderModal();
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const statusSelect = selects.find(s => s.value === 'PENDING');
    expect(statusSelect).toBeTruthy();
    expect(statusSelect!.disabled).toBe(true);
  });

  it('enables status select when editing an existing task', () => {
    renderModal({
      editingTask: {
        id: 1,
        title: 'Existing',
        priority: Priority.HIGH,
        status: TaskStatus.ACTIVE,
        tags: [{ id: 1, name: 'Work' }],
      },
    });
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const statusSelect = selects.find(s => s.value === 'ACTIVE');
    expect(statusSelect).toBeTruthy();
    expect(statusSelect!.disabled).toBe(false);
  });

  it('creates a new tag through the repository with its real id', async () => {
    const onTagCreated = vi.fn();
    const { repository } = renderModal({ onTagCreated });

    fireEvent.change(screen.getByPlaceholderText(/Nueva etiqueta/), { target: { value: 'NewTag' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear/i }));

    await waitFor(() => expect(onTagCreated).toHaveBeenCalledTimes(1));
    const call = onTagCreated.mock.calls[0][0] as Tag;
    expect(call.name).toBe('NewTag');
    const stored = await repository.listTags();
    expect(stored).toHaveLength(1);
    expect(call.id).toBe(stored[0].id);
  });

  it('shows a validation ErrorBanner when the tag name is blank', async () => {
    const { repository } = renderModal();
    const spy = vi.spyOn(repository, 'createTag');

    fireEvent.change(screen.getByPlaceholderText(/Nueva etiqueta/), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear/i }));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('Nombre de etiqueta inválido')).toBeTruthy());
    expect(await repository.listTags()).toHaveLength(0);
  });

  it('shows a user-friendly ErrorBanner when tag creation fails with a duplicate (409)', async () => {
    const { repository } = renderModal();
    await repository.createTag('Work');

    fireEvent.change(screen.getByPlaceholderText(/Nueva etiqueta/), { target: { value: 'Work' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear/i }));

    await waitFor(() => expect(screen.getByText('Esta etiqueta ya existe')).toBeTruthy());
  });

  it('deletes a tag through the repository', async () => {
    const onTagDeleted = vi.fn();
    const { repository } = renderModal({ onTagDeleted });
    const created = await repository.createTag('Work');

    fireEvent.click(screen.getByRole('button', { name: /Borrar etiqueta Work/i }));

    await waitFor(() => expect(onTagDeleted).toHaveBeenCalledWith(created.id));
    expect(await repository.listTags()).toHaveLength(0);
  });

  it('removes a deleted tag from the selected tags so it is not re-created on save', async () => {
    const onSave = vi.fn();
    const { repository } = renderModal({
      onSave,
      editingTask: {
        id: 1,
        title: 'Existing',
        priority: Priority.HIGH,
        status: TaskStatus.ACTIVE,
        tags: [{ id: 1, name: 'Work' }, { id: 2, name: 'Personal' }],
      },
    });
    await repository.createTag('Work');
    await repository.createTag('Personal');

    fireEvent.click(screen.getByRole('button', { name: /Borrar etiqueta Work/i }));
    await waitFor(async () => expect(await repository.listTags()).toHaveLength(1));

    const titleInput = screen.getByPlaceholderText(/Título de la tarea/) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Updated' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    const input = onSave.mock.calls[0][0] as TaskInput;
    expect(input.tagNames).toEqual(['Personal']);
  });

  it('shows a user-friendly ErrorBanner when deleting a non-existent tag (404)', async () => {
    // Repository is empty while existingTags still lists Work: deleteTag rejects as not-found.
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /Borrar etiqueta Work/i }));

    await waitFor(() => expect(screen.getByText('La etiqueta ya no existe')).toBeTruthy());
  });

  it('saves the selected tags when editing a task', () => {
    const onSave = vi.fn();
    renderModal({
      onSave,
      editingTask: {
        id: 1,
        title: 'Existing',
        priority: Priority.HIGH,
        status: TaskStatus.ACTIVE,
        tags: [{ id: 1, name: 'Work' }],
      },
    });

    fireEvent.click(screen.getByText('Personal'));
    fireEvent.change(screen.getByPlaceholderText(/Título de la tarea/), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    const input = onSave.mock.calls[0][0] as TaskInput;
    expect(input.tagNames).toEqual(['Work', 'Personal']);
  });
});
