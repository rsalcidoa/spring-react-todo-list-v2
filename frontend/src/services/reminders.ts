import { getDueReminders, ackReminder } from './ApiService';
import { Task } from './types/task';

/** Fetch due reminders, invoke `notify` for each, then acknowledge it. */
export async function pollReminders(notify: (task: Task) => void): Promise<number> {
  const response = await getDueReminders();
  const items: Task[] = Array.isArray(response.data) ? response.data : [];
  for (const task of items) {
    notify(task);
    await ackReminder(task.id);
  }
  return items.length;
}

export interface ReminderHandle {
  stop(): void;
}

/** Poll reminders while the tab is open. Errors are swallowed (best-effort). */
export function startReminderPolling(notify: (task: Task) => void, intervalMs = 60000): ReminderHandle {
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    try {
      await pollReminders(notify);
    } catch {
      /* best-effort: ignore network/permission errors */
    }
  };
  void tick();
  const timer = window.setInterval(tick, intervalMs);
  return { stop: () => { stopped = true; window.clearInterval(timer); } };
}

/** Show a browser notification for a due reminder, if permitted. */
export function browserNotify(task: Task): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    new Notification('Recordatorio', { body: task.title });
  } else if (Notification.permission !== 'denied') {
    void Notification.requestPermission();
  }
}
