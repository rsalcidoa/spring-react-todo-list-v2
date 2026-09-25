import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TodoListPage from '../pages/TodoListPage';
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
        <Routes>
          <Route path="/tasks" element={<TodoListPage repository={repository} />} />
        </Routes>
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

  it('renders three Kanban columns with correct labels', async () => {
    renderWithRepo(new InMemoryTaskRepository());
    await waitFor(() => expect(screen.getByText(/Task Board/i)).toBeTruthy());
    expect(screen.getByText(/To Do/i)).toBeTruthy();
    expect(screen.getByText(/In Progress/i)).toBeTruthy();
    expect(screen.getByText(/Done/i)).toBeTruthy();
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
    await waitFor(() => expect(screen.queryByText(/Task Board/i)).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /\+ Task/i }));
    fireEvent.change(screen.getByPlaceholderText(/Enter task title/), { target: { value: 'New Modal Task' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

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
    fireEvent.click(taskACard!.querySelector('button[aria-label="Delete task"]')!);

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
    expect(console.error).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('saves edited tags with real ids from the repository', async () => {
    const { repository } = await seedBoard();
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });

    fireEvent.click(screen.getByText(/Task Alpha/i).closest('[data-task]')!);
    await waitFor(() => expect(screen.queryByText(/Edit Task/i)).toBeTruthy());

    fireEvent.click(screen.getByText('Personal'));
    fireEvent.change(screen.getByPlaceholderText(/Enter task title/), { target: { value: 'Task Alpha updated' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => expect(screen.queryByText(/Task Alpha updated/i)).toBeTruthy());
    const tasks = await repository.fetchAll();
    const saved = tasks.find(t => t.title === 'Task Alpha updated')!;
    expect(saved.tags.map(t => t.name).sort()).toEqual(['Personal', 'Work']);
    expect(saved.tags.every(t => typeof t.id === 'number')).toBe(true);
  });

  it('removes a deleted tag from the repository and unassigns it', async () => {
    const { repository } = await seedBoard();
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });

    fireEvent.click(screen.getByText(/Task Alpha/i).closest('[data-task]')!);
    await waitFor(() => expect(screen.queryByText(/Edit Task/i)).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /Delete tag Personal/i }));

    await waitFor(async () => expect(await repository.listTags()).toHaveLength(1));
    const tasks = await repository.fetchAll();
    expect(tasks.every(t => t.tags.every(tag => tag.name !== 'Personal'))).toBe(true);
  });

  it('creates tags with real ids so they reconcile without refresh hacks', async () => {
    const repository = new InMemoryTaskRepository();
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Board/i)).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /\+ Task/i }));
    fireEvent.change(screen.getByPlaceholderText(/New tag name/), { target: { value: 'NewTag' } });
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(async () => expect(await repository.listTags()).toHaveLength(1));
    const [tag] = await repository.listTags();
    expect(typeof tag.id).toBe('number');

    fireEvent.change(screen.getByPlaceholderText(/Enter task title/), { target: { value: 'Tagged Task' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => expect(screen.queryByText(/Tagged Task/i)).toBeTruthy());
    const tasks = await repository.fetchAll();
    expect(tasks[0].tags).toEqual([{ id: tag.id, name: 'NewTag' }]);
  });

  it('rolls back optimistic status when move fails', async () => {
    const { repository } = await seedBoard();
    vi.spyOn(repository, 'move').mockRejectedValueOnce(new Error('offline'));
    renderWithRepo(repository);
    await waitFor(() => expect(screen.queryByText(/Task Alpha/i)).toBeTruthy(), { timeout: 5000 });

    const header = screen.getByText('In Progress');
    const body = header.closest('div')!.querySelector('div')!;
    fireEvent.drop(body, {
      dataTransfer: { getData: () => '1' },
      preventDefault: () => {},
    });

    await waitFor(() => expect(screen.getByText(/offline/i)).toBeTruthy());
    const tasks = await repository.fetchAll();
    expect(tasks.find(t => t.id === 1)!.status).toBe(TaskStatus.PENDING);
  });
});
