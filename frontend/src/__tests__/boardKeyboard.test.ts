import { describe, it, expect } from 'vitest';
import { nextStatus } from '../services/boardKeyboard';
import { TaskStatus } from '../services/types/task';

describe('nextStatus', () => {
  it('moves forward through the order', () => {
    expect(nextStatus(TaskStatus.PENDING, 'right')).toBe(TaskStatus.ACTIVE);
    expect(nextStatus(TaskStatus.ACTIVE, 'right')).toBe(TaskStatus.COMPLETED);
  });

  it('moves backward through the order', () => {
    expect(nextStatus(TaskStatus.COMPLETED, 'left')).toBe(TaskStatus.ACTIVE);
    expect(nextStatus(TaskStatus.ACTIVE, 'left')).toBe(TaskStatus.PENDING);
  });

  it('is a no-op at the ends of the order', () => {
    expect(nextStatus(TaskStatus.PENDING, 'left')).toBeNull();
    expect(nextStatus(TaskStatus.COMPLETED, 'right')).toBeNull();
  });
});
