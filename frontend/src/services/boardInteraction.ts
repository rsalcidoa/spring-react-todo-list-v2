import { Task, TaskStatus } from './types/task';

/**
 * Board interactions as one module: keyboard-to-status, drag-to-index,
 * position math, focus restoration and due-date presentation. The arithmetic
 * stays private; the seam is the interaction.
 */

export type MoveDirection = 'left' | 'right';
export type BoardView = 'all' | 'today' | 'overdue' | 'upcoming';
export type DueState = 'overdue' | 'today' | 'future' | 'none';

const ORDER: TaskStatus[] = [TaskStatus.PENDING, TaskStatus.ACTIVE, TaskStatus.COMPLETED];

/** Target column for a keyboard move, or null at the ends of the order. */
export function keyboardTarget(current: TaskStatus, direction: MoveDirection): TaskStatus | null {
  const index = ORDER.indexOf(current);
  if (index === -1) return null;
  const target = direction === 'right' ? index + 1 : index - 1;
  if (target < 0 || target >= ORDER.length) return null;
  return ORDER[target];
}

/**
 * Position between two neighbors for manual ordering. Uses a double so an
 * insert between two cards does not rewrite the rest of the column.
 */
export function positionBetween(before?: number, after?: number): number {
  if (before == null && after == null) return 1;
  if (before == null) return (after as number) - 1;
  if (after == null) return before + 1;
  return (before + after) / 2;
}

/** Drop index for a pointer Y against the rendered card rectangles. */
export function dropIndex(clientY: number, rects: Array<{ top: number; height: number }>): number {
  for (let i = 0; i < rects.length; i++) {
    if (clientY < rects[i].top + rects[i].height / 2) {
      return i;
    }
  }
  return rects.length;
}

/** Focus the card for a task after a keyboard move (name-based, avoids refs). */
export function restoreFocus(taskId: number): void {
  const el = document.querySelector(`[data-task="${taskId}"]`) as HTMLElement | null;
  el?.focus();
}

/** Local yyyy-MM-dd for date-only comparison (no timezone pitfalls). */
export function todayLocal(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDueState(dueDate: string | undefined | null, today: string = todayLocal()): DueState {
  if (!dueDate) return 'none';
  if (dueDate < today) return 'overdue';
  if (dueDate > today) return 'future';
  return 'today';
}

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
