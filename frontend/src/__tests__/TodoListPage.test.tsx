import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TodoListPage from '../pages/TodoListPage';
import { ThemeProvider } from '../context/ThemeContext';
import { InMemoryTaskRepository } from '../data/TaskRepository';
import { Priority, TaskStatus } from '../services/types/task';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    logout: vi.fn(),
  })),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TodoListPage Kanban (through the repository seam)', () => {
  const renderWithRepo = (repository: InMemoryTaskRepository) => {
    return render(
      <MemoryRouter initialEntries={['/tasks']}>
        <ThemeProvider>
          <Routes>
            <Route path="/tasks" element={<TodoListPage repository={repository} />} />
          </Routes>
        </ThemeProvider>
      </MemoryRouter>,
    );
  };

  async function seedBoard() {
    const repository = new InMemoryTaskRepository();
    const work = await repository.createTag('Work');
    const personal = await repository.createTag('Personal');
    await repository.create({
      title: 'Task Alpha', description: 'Desc A', priority: Priority.LOW,
      status: TaskStatus.PENDING, tagNames: ['Work'],
    });
    await repository.create({
      title: 'Task Beta', description: 'Desc B', priority: Priority.HIGH,
      status: TaskStatus.ACTIVE, tagNames: [],
    });
    return { repository, work, personal };
  }

  it('renders three Kanban columns with correct labels and counts', async () => {
    const { repository } = await seedBoard();
    renderWithRepo(repository);
    await waitFor(() => expect(screen.getByText(/Tablero/i)).toBeTruthy());
    await waitFor(() => expect(screen.getByRole('heading', { name: /Por hacer 1/ })).toBeTruthy());
    expect(screen.getByRole('heading', { name: /En progreso 1/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Hecho 0/ })).toBeTruthy();
    expect(screen.getByText(/Tablero/i).closest('h1')?.textContent).toMatch(/2/);
  });

  it('shows an empty state with a create action when there are no tasks', async () => {
    renderWithRepo(new InMemoryTaskRepository());
    await waitFor(() => expect(screen.getByText(/No hay tareas todavía/i)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Crear tarea/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
  });

  it('renders the plain empty text in a column with no tasks', async () => {
    const { repository } = await seedBoard();
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });

    expect(screen.getByText('Sin tareas')).toBeTruthy();
  });

  it('shows a single banner when two errors occur within 5s', async () => {
    const { repository } = await seedBoard();
    vi.spyOn(repository, 'move').mockRejectedValueOnce(new Error('move-fail'));
    vi.spyOn(repository, 'remove').mockRejectedValueOnce(new Error('remove-fail'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });

    const header = screen.getByText('En progreso');
    const body = header.closest('div')!.querySelector('div')!;
    fireEvent.drop(body, {
      dataTransfer: { getData: () => '1' },
      preventDefault: () => {},
    });
    await waitFor(() => expect(screen.getByText(/No se pudo mover: move-fail/i)).toBeTruthy());

    const card = screen.getByText(/Task Alpha/i).closest('[data-task]') as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: /Borrar tarea/i }));
    await waitFor(() => expect(screen.getByText(/remove-fail/i)).toBeTruthy());

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].textContent).toMatch(/remove-fail/);
  });

  it('shows skeletons while loading', async () => {
    const repository = new InMemoryTaskRepository();
    vi.spyOn(repository, 'fetchAll').mockImplementation(() => new Promise(() => {}));
    vi.spyOn(repository, 'listTags').mockImplementation(() => new Promise(() => {}));
    renderWithRepo(repository);
    await waitFor(() => expect(screen.getByRole('status', { name: /Cargando tareas/i })).toBeTruthy());
  });

  it('displays tasks in the correct columns by status', async () => {
    const { repository } = await seedBoard();
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });
    expect(screen.queryByText(/Task Beta/i)).toBeTruthy();
  });

  it('creates a task via modal and stores it through the repository', async () => {
    const repository = new InMemoryTaskRepository();
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Tablero/i)).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /\+ Tarea/i }));
    fireEvent.change(screen.getByPlaceholderText(/Título de la tarea/), { target: { value: 'New Modal Task' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => expect(screen.queryByText(/New Modal Task/i)).toBeTruthy());
    const tasks = await repository.fetchAll();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('New Modal Task');
  });

  it('deletes a task via delete button and removes it from the repository', async () => {
    const { repository } = await seedBoard();
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const taskACard = screen.getByText(/Task Alpha/i).closest('[data-task]');
    fireEvent.click(taskACard!.querySelector('button[aria-label="Borrar tarea"]')!);

    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeNull(), { timeout: 5000 });
    expect(await repository.fetchAll()).toHaveLength(1);
  });

  it('shows ErrorBanner instead of console.error when loading tasks fails', async () => {
    const repository = new InMemoryTaskRepository();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(repository, 'fetchAll').mockRejectedValueOnce(new Error('Network down'));

    renderWithRepo(repository);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeTruthy();
    expect(screen.getByText(/Network down/)).toBeTruthy();
    expect(vi.mocked(console.error).mock.calls.flat().join('\n')).not.toContain('Network down');

    fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: /Cerrar/i }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('saves edited tags with real ids from the repository', async () => {
    const { repository } = await seedBoard();
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });

    fireEvent.click(screen.getByText(/Task Alpha/i).closest('[data-task]')!);
    await waitFor(() => expect(screen.queryByText(/Editar tarea/i)).toBeTruthy());

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByText('Personal'));
    fireEvent.change(screen.getByPlaceholderText(/Título de la tarea/), { target: { value: 'Task Alpha updated' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => expect(screen.queryByText(/Task Alpha updated/i)).toBeTruthy());
    const tasks = await repository.fetchAll();
    const saved = tasks.find(t => t.title === 'Task Alpha updated')!;
    expect(saved.tags.map(t => t.name).sort()).toEqual(['Personal', 'Work']);
    expect(saved.tags.every(t => typeof t.id === 'number')).toBe(true);
  });

  it('removes a deleted tag from the repository and unassigns it', async () => {
    const { repository } = await seedBoard();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });

    fireEvent.click(screen.getByText(/Task Alpha/i).closest('[data-task]')!);
    await waitFor(() => expect(screen.queryByText(/Editar tarea/i)).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /Borrar etiqueta Personal/i }));

    await waitFor(async () => expect(await repository.listTags()).toHaveLength(1));
    const tasks = await repository.fetchAll();
    expect(tasks.every(t => t.tags.every(tag => tag.name !== 'Personal'))).toBe(true);
  });

  it('refreshes the tags list from the repository after deleting a tag', async () => {
    const { repository } = await seedBoard();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });

    fireEvent.click(screen.getByText(/Task Alpha/i).closest('[data-task]')!);
    await waitFor(() => expect(screen.queryByText(/Editar tarea/i)).toBeTruthy());

    const listSpy = vi.spyOn(repository, 'listTags');
    fireEvent.click(screen.getByRole('button', { name: /Borrar etiqueta Personal/i }));

    await waitFor(() => expect(listSpy).toHaveBeenCalled());
  });

  it('creates tags with real ids so they reconcile without refresh hacks', async () => {
    const repository = new InMemoryTaskRepository();
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Tablero/i)).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /\+ Tarea/i }));
    fireEvent.change(screen.getByPlaceholderText(/Nueva etiqueta/), { target: { value: 'NewTag' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Crear/i }));

    await waitFor(async () => expect(await repository.listTags()).toHaveLength(1));
    const [tag] = await repository.listTags();
    expect(typeof tag.id).toBe('number');

    fireEvent.change(screen.getByPlaceholderText(/Título de la tarea/), { target: { value: 'Tagged Task' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => expect(screen.queryByText(/Tagged Task/i)).toBeTruthy());
    const tasks = await repository.fetchAll();
    expect(tasks[0].tags).toEqual([{ id: tag.id, name: 'NewTag' }]);
  });

  it('rolls back optimistic status when move fails', async () => {
    const { repository } = await seedBoard();
    vi.spyOn(repository, 'move').mockRejectedValueOnce(new Error('offline'));
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });

    const header = screen.getByText('En progreso');
    const body = header.closest('div')!.querySelector('div')!;
    fireEvent.drop(body, {
      dataTransfer: { getData: () => '1' },
      preventDefault: () => {},
    });

    await waitFor(() => expect(screen.getByText(/No se pudo mover: offline/i)).toBeTruthy());
    const tasks = await repository.fetchAll();
    expect(tasks.find(t => t.id === 1)!.status).toBe(TaskStatus.PENDING);
  });

  it('filters visible tasks by tag and clears the filter', async () => {
    const { repository } = await seedBoard();
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });
    expect(screen.queryByText(/Task Beta/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Work', pressed: false }));
    await waitFor(() => {
      expect(screen.queryByText(/Task Alpha/i)).toBeTruthy();
      expect(screen.queryByText(/Task Beta/i)).toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: /Limpiar/i }));
    await waitFor(() => expect(screen.queryByText(/Task Beta/i)).toBeTruthy());
  });

  it('highlights the drop target on drag over', async () => {
    const { repository } = await seedBoard();
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });

    const header = screen.getByText('En progreso');
    const body = header.closest('div')!.querySelector('div')!;
    fireEvent.dragOver(body);
    expect(body.className).toMatch(/dragover/);
    fireEvent.dragLeave(body);
    expect(body.className).not.toMatch(/dragover/);
  });

  it('shows due-state treatments on dated cards', async () => {
    const repository = new InMemoryTaskRepository();
    const pad = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const now = new Date();
    const past = new Date(now); past.setDate(now.getDate() - 1);
    const future = new Date(now); future.setDate(now.getDate() + 1);
    await repository.create({
      title: 'Overdue T', priority: Priority.LOW, status: TaskStatus.PENDING,
      tagNames: [], dueDate: pad(past),
    });
    await repository.create({
      title: 'Today T', priority: Priority.LOW, status: TaskStatus.PENDING,
      tagNames: [], dueDate: pad(now),
    });
    await repository.create({
      title: 'Future T', priority: Priority.LOW, status: TaskStatus.PENDING,
      tagNames: [], dueDate: pad(future),
    });
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Overdue T/i)).toBeTruthy());

    const chip = (title: string) => {
      const card = screen.getByText(title).closest('[data-task]')!;
      return card.querySelector('span[class*="dueDate"]')!;
    };
    expect(chip('Overdue T').className).toMatch(/dueOverdue/);
    expect(chip('Today T').className).toMatch(/dueToday/);
    expect(chip('Future T').className).not.toMatch(/dueOverdue|dueToday/);
  });
});
