import { describe, it, expect, afterEach } from 'vitest';
import {
  filterByView,
  getDueState,
  keyboardTarget,
  positionBetween,
  dropIndex,
  restoreFocus,
  todayLocal,
} from '../services/boardInteraction';
import { Task, TaskStatus, Priority } from '../services/types/task';

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

describe('datetime helpers', () => {
  const today = '2026-09-25';

  it('getDueState returns none without a date', () => {
    expect(getDueState(undefined, today)).toBe('none');
    expect(getDueState('', today)).toBe('none');
    expect(getDueState(null, today)).toBe('none');
  });

  it('getDueState classifies past, today and future', () => {
    expect(getDueState('2026-09-24', today)).toBe('overdue');
    expect(getDueState('2026-09-25', today)).toBe('today');
    expect(getDueState('2026-09-26', today)).toBe('future');
  });

  it('todayLocal formats local yyyy-MM-dd', () => {
    expect(todayLocal(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(todayLocal(new Date(2026, 11, 31))).toBe('2026-12-31');
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

describe('filterByView', () => {
  const TODAY = '2026-06-15';

  function task(overrides: Partial<Task> & { title: string }): Task {
    return { id: Math.floor(Math.random() * 100000), priority: Priority.LOW, status: TaskStatus.PENDING, tags: [], ...overrides };
  }

  const tasks: Task[] = [
    task({ title: 'Today pending', dueDate: TODAY }),
    task({ title: 'Today active', dueDate: TODAY, status: TaskStatus.ACTIVE }),
    task({ title: 'Today done', dueDate: TODAY, status: TaskStatus.COMPLETED }),
    task({ title: 'Yesterday', dueDate: '2026-06-14' }),
    task({ title: 'In 7 days', dueDate: '2026-06-22' }),
    task({ title: 'In 8 days', dueDate: '2026-06-23' }),
    task({ title: 'No date' }),
  ];

  const titles = (view: Parameters<typeof filterByView>[1]) =>
    filterByView(tasks, view, TODAY).map(t => t.title).sort();

  it('all returns every task', () => {
    expect(filterByView(tasks, 'all', TODAY)).toHaveLength(tasks.length);
  });

  it('today returns non-completed tasks due today', () => {
    expect(titles('today')).toEqual(['Today active', 'Today pending']);
  });

  it('overdue returns non-completed tasks before today', () => {
    expect(titles('overdue')).toEqual(['Yesterday']);
  });

  it('upcoming returns non-completed tasks after today within 7 days', () => {
    expect(titles('upcoming')).toEqual(['In 7 days']);
  });

  it('ignores tasks without a due date for time views', () => {
    expect(titles('overdue')).not.toContain('No date');
    expect(titles('today')).not.toContain('No date');
    expect(titles('upcoming')).not.toContain('No date');
  });
});
