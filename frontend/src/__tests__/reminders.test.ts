import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pollReminders, browserNotify } from '../services/reminders';
import * as ApiService from '../services/ApiService';
import { Priority, TaskStatus, Task } from '../services/types/task';

vi.mock('../services/ApiService', () => ({
  getDueReminders: vi.fn(),
  ackReminder: vi.fn(),
}));

function task(id: number, title: string): Task {
  return { id, title, priority: Priority.LOW, status: TaskStatus.PENDING, tags: [] };
}

describe('reminders poller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('notifies and acknowledges each due reminder', async () => {
    vi.mocked(ApiService.getDueReminders).mockResolvedValueOnce({ data: [task(1, 'A'), task(2, 'B')] } as never);
    vi.mocked(ApiService.ackReminder).mockResolvedValue({} as never);
    const notify = vi.fn();

    const count = await pollReminders(notify);

    expect(count).toBe(2);
    expect(notify).toHaveBeenCalledTimes(2);
    expect(ApiService.ackReminder).toHaveBeenCalledWith(1);
    expect(ApiService.ackReminder).toHaveBeenCalledWith(2);
  });

  it('browserNotify does not throw when Notification is unavailable', () => {
    expect(() => browserNotify(task(1, 'X'))).not.toThrow();
  });
});
