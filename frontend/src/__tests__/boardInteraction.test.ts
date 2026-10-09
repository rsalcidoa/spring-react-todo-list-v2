import { describe, it, expect, afterEach } from 'vitest';
import {
  keyboardTarget,
  positionBetween,
  dropIndex,
  restoreFocus,
} from '../services/boardInteraction';
import { TaskStatus } from '../services/types/task';

describe('keyboardTarget', () => {
  it('moves forward and backward through the order', () => {
    expect(keyboardTarget(TaskStatus.PENDING, 'right')).toBe(TaskStatus.ACTIVE);
    expect(keyboardTarget(TaskStatus.ACTIVE, 'right')).toBe(TaskStatus.COMPLETED);
    expect(keyboardTarget(TaskStatus.COMPLETED, 'left')).toBe(TaskStatus.ACTIVE);
    expect(keyboardTarget(TaskStatus.ACTIVE, 'left')).toBe(TaskStatus.PENDING);
  });

  it('is a no-op at the ends of the order', () => {
    expect(keyboardTarget(TaskStatus.PENDING, 'left')).toBeNull();
    expect(keyboardTarget(TaskStatus.COMPLETED, 'right')).toBeNull();
  });
});

describe('positionBetween', () => {
  it('returns a base position when there are no neighbors', () => {
    expect(positionBetween(undefined, undefined)).toBe(1);
  });

  it('appends after the last position', () => {
    expect(positionBetween(2, undefined)).toBe(3);
  });

  it('prepends before the first position', () => {
    expect(positionBetween(undefined, 4)).toBe(3);
  });

  it('returns the midpoint between two neighbors', () => {
    expect(positionBetween(1, 2)).toBe(1.5);
  });
});

describe('dropIndex', () => {
  const rect = (top: number, height = 40) => ({ top, height });

  it('inserts before the first card when above its midpoint', () => {
    expect(dropIndex(0, [rect(0), rect(40), rect(80)])).toBe(0);
  });

  it('inserts between cards based on the midpoint', () => {
    expect(dropIndex(50, [rect(0), rect(40), rect(80)])).toBe(1);
    expect(dropIndex(70, [rect(0), rect(40), rect(80)])).toBe(2);
  });

  it('appends when below every midpoint', () => {
    expect(dropIndex(500, [rect(0), rect(40), rect(80)])).toBe(3);
  });

  it('appends to an empty column', () => {
    expect(dropIndex(10, [])).toBe(0);
  });
});

describe('restoreFocus', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('focuses the card for a task id', () => {
    const el = document.createElement('div');
    el.setAttribute('data-task', '7');
    el.tabIndex = 0;
    document.body.appendChild(el);

    restoreFocus(7);

    expect(document.activeElement).toBe(el);
  });
});
