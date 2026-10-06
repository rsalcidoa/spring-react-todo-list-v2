import { TaskStatus } from './types/task';

export type MoveDirection = 'left' | 'right';

const ORDER: TaskStatus[] = [TaskStatus.PENDING, TaskStatus.ACTIVE, TaskStatus.COMPLETED];

/** Target column for a keyboard move, or null at the ends of the order. */
export function nextStatus(current: TaskStatus, direction: MoveDirection): TaskStatus | null {
  const index = ORDER.indexOf(current);
  if (index === -1) return null;
  const target = direction === 'right' ? index + 1 : index - 1;
  if (target < 0 || target >= ORDER.length) return null;
  return ORDER[target];
}
