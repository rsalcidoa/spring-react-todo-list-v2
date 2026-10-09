import { Task, TaskStatus } from './types/task';

/**
 * Board interaction as one module: keyboard-to-status, drag-to-index and focus
 * restoration. Selection, ordering and Due state live in `boardQuery`.
 */

export type MoveDirection = 'left' | 'right';

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
