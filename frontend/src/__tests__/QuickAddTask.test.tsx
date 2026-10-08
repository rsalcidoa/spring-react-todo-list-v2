import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import QuickAddTask from '../components/QuickAddTask';
import { TaskStatus } from '../services/types/task';

afterEach(cleanup);

describe('QuickAddTask', () => {
  it('creates a task with the trimmed title and the column status', async () => {
    const onCreate = vi.fn().mockResolvedValue(true);
    render(<QuickAddTask status={TaskStatus.ACTIVE} onCreate={onCreate} />);

    const input = screen.getByPlaceholderText(/Añadir tarea/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  Nueva  ' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Nueva', TaskStatus.ACTIVE));
    await waitFor(() => expect(input.value).toBe(''));
  });

  it('blocks an empty submit inline without calling onCreate', async () => {
    const onCreate = vi.fn().mockResolvedValue(true);
    render(<QuickAddTask status={TaskStatus.PENDING} onCreate={onCreate} />);

    const input = screen.getByPlaceholderText(/Añadir tarea/i);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('clears the inline error when the user types', async () => {
    const onCreate = vi.fn().mockResolvedValue(true);
    render(<QuickAddTask status={TaskStatus.PENDING} onCreate={onCreate} />);

    const input = screen.getByPlaceholderText(/Añadir tarea/i);
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());

    fireEvent.change(input, { target: { value: 'Now typed' } });

    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('keeps the value when creation fails', async () => {
    const onCreate = vi.fn().mockResolvedValue(false);
    render(<QuickAddTask status={TaskStatus.PENDING} onCreate={onCreate} />);

    const input = screen.getByPlaceholderText(/Añadir tarea/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'X' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(input.value).toBe('X');
  });
});
