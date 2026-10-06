import { describe, it, expect } from 'vitest';
import { filterByView } from '../services/boardView';
import { Task, TaskStatus, Priority } from '../services/types/task';

const TODAY = '2026-06-15';

function task(overrides: Partial<Task> & { title: string }): Task {
  return {
    id: Math.floor(Math.random() * 100000),
    priority: Priority.LOW,
    status: TaskStatus.PENDING,
    tags: [],
    ...overrides,
  };
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

describe('filterByView', () => {
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
