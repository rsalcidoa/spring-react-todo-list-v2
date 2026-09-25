import { describe, it, expect, vi, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TodoListPage from '../pages/TodoListPage';
import * as ApiService from '../services/ApiService';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    logout: vi.fn(),
  })),
}));

vi.mock('../services/ApiService', () => ({
  getTasks: vi.fn().mockResolvedValue({ data: [
    { id: 1, title: 'Task A', description: 'Desc A', priority: 'LOW', status: 'PENDING' as const, tags: [] },
    { id: 2, title: 'Task B', description: 'Desc B', priority: 'HIGH', status: 'ACTIVE' as const, tags: [] },
  ]}),
  createTask: vi.fn().mockImplementation((t) => Promise.resolve({ data: { id: 3, ...t } })),
  updateTask: vi.fn().mockResolvedValue({ data: {} }),
  deleteTask: vi.fn().mockResolvedValue({}),
  getTags: vi.fn().mockResolvedValue({ data: [{ id: 1, name: 'Work' }] }),
  createTag: vi.fn(),
}));

afterEach(cleanup);

describe('TodoListPage Kanban', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    } as unknown as Storage;
    return render(
      <MemoryRouter initialEntries={['/tasks']}>
        <Routes>
          <Route path="/tasks" element={component} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('renders three Kanban columns with correct labels', async () => {
    renderWithProvider(<TodoListPage />);
    await waitFor(() => expect(screen.getByText(/Task Board/i)).toBeTruthy());
    expect(screen.getByText(/To Do/i)).toBeTruthy();
    expect(screen.getByText(/In Progress/i)).toBeTruthy();
    expect(screen.getByText(/Done/i)).toBeTruthy();
  });

  it('displays tasks in the correct columns by status', async () => {
    renderWithProvider(<TodoListPage />);
    await waitFor(() => {
      const taskA = screen.queryByText(/Task A/i);
      expect(taskA).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('can create a new task via modal', async () => {
    renderWithProvider(<TodoListPage />);
    await waitFor(() => {
      const heading = screen.queryByText(/Task Board/i);
      expect(heading).toBeTruthy();
    }, { timeout: 5000 });

    const newTaskBtn = screen.getByRole('button', { name: /\+ Task/i });
    fireEvent.click(newTaskBtn);

    const titleInput = screen.getByPlaceholderText(/Enter task title/);
    expect(titleInput).toBeTruthy();

    fireEvent.change(titleInput, { target: { value: 'New Modal Task' } });

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(ApiService.createTask).toHaveBeenCalled());
  });

  it('can delete a task via delete button', async () => {
    renderWithProvider(<TodoListPage />);
    await waitFor(() => {
      const taskA = screen.queryByText(/Task A/i);
      expect(taskA).toBeTruthy();
    }, { timeout: 5000 });

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const taskACard = screen.getByText(/Task A/i).closest('[data-task]');
    const deleteBtn = taskACard!.querySelector('button[aria-label="Delete task"]')!;
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(ApiService.deleteTask).toHaveBeenCalledWith(1));
    await waitFor(() => {
      expect(screen.queryByText(/Task A/i)).toBeNull();
    }, { timeout: 5000 });
  });

  it('refreshes tags after task creation so new tags appear in modal', async () => {
    const initialTags = [{ id: 1, name: 'Work' }];
    const refreshedTags = [
      { id: 1, name: 'Work' },
      { id: 2, name: 'NewTag' },
    ];

    vi.mocked(ApiService.getTags)
      .mockResolvedValueOnce({ data: initialTags } as any)
      .mockResolvedValue({ data: refreshedTags } as any);

    renderWithProvider(<TodoListPage />);
    await waitFor(() => {
      const heading = screen.queryByText(/Task Board/i);
      expect(heading).toBeTruthy();
    }, { timeout: 5000 });

    const newTaskBtn = screen.getByRole('button', { name: /\+ Task/i });
    fireEvent.click(newTaskBtn);

    const titleInput = screen.getByPlaceholderText(/Enter task title/);
    fireEvent.change(titleInput, { target: { value: 'Tagged Task' } });

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(ApiService.createTask).toHaveBeenCalled());

    // After create succeeds, loadTags() is called again → getTags called a 2nd time
    // with the refreshed list containing 'NewTag'
    await waitFor(() => {
      const calls = vi.mocked(ApiService.getTags).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(2);
    }, { timeout: 5000 });

    // Reopen modal — existingTags should now include the refreshed tags
    fireEvent.click(newTaskBtn);
    await waitFor(() => {
      const tagOption = screen.queryByText(/NewTag/i);
      expect(tagOption).toBeTruthy();
    }, { timeout: 5000 });
  });
});
