import { Task, TaskStatus } from './types/task';
import { todayLocal } from './dueState';

export type BoardView = 'all' | 'today' | 'overdue' | 'upcoming';

/** Local yyyy-MM-dd shifted by N days from a date-only string. */
function shift(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Scopes tasks for a board view against the local date. Time-based views
 * exclude COMPLETED tasks and tasks without a due date; `all` is a no-op.
 */
export function filterByView(tasks: Task[], view: BoardView, today: string = todayLocal()): Task[] {
  if (view === 'all') return tasks;

  const horizon = shift(today, 7);
  return tasks.filter(task => {
    if (task.status === TaskStatus.COMPLETED) return false;
    const due = task.dueDate;
    if (!due) return false;
    if (view === 'today') return due === today;
    if (view === 'overdue') return due < today;
    return due > today && due <= horizon; // upcoming
  });
}
