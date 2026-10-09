import { describe, it, expect } from 'vitest';
import {
  applyBoardQuery,
  boardQueryFrom,
  getDueState,
  filterByView,
  todayLocal,
  type BoardFilters,
  type BoardQuery,
} from '../services/boardQuery';
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

const board: Task[] = [
  task({ id: 1, title: 'Alpha informe', description: 'x', priority: Priority.LOW, dueDate: '2026-03-01', projectId: 1, tags: [{ id: 10, name: 'Work' }] }),
  task({ id: 2, title: 'Beta', priority: Priority.HIGH, dueDate: '2026-01-01', projectId: 2 }),
  task({ id: 3, title: 'Gamma', description: 'informe de compra', priority: Priority.MEDIUM, projectId: 1, tags: [{ id: 10, name: 'Work' }] }),
  task({ id: 4, title: 'Overdue', dueDate: '2026-06-14' }),
  task({ id: 5, title: 'TodayX', dueDate: TODAY }),
  task({ id: 6, title: 'UpcomingX', dueDate: '2026-06-20' }),
  task({ id: 7, title: 'Done today', dueDate: TODAY, status: TaskStatus.COMPLETED }),
];

const ids = (query: BoardQuery) => applyBoardQuery(board, query, TODAY).map(t => t.id);

describe('applyBoardQuery', () => {
  it('matches the search text against title and description', () => {
    expect(ids({ q: 'informe' }).sort()).toEqual([1, 3]);
  });

  it('filters by priority', () => {
    expect(ids({ priority: Priority.HIGH })).toEqual([2]);
  });

  it('filters by tag ids', () => {
    expect(ids({ tagIds: [10] }).sort()).toEqual([1, 3]);
  });

  it('filters by project id', () => {
    expect(ids({ projectId: 1 }).sort()).toEqual([1, 3]);
  });

  it('filters to tasks without a project with the none scope', () => {
    const subset = [board[0], task({ title: 'Suelta', projectId: undefined })];
    expect(applyBoardQuery(subset, { projectId: 'none' }, TODAY).map(t => t.title)).toEqual(['Suelta']);
  });

  it('filters by board view against the local date', () => {
    expect(ids({ view: 'overdue' }).sort((a, b) => a - b)).toEqual([1, 2, 4]);
    expect(ids({ view: 'today' })).toEqual([5]);
    expect(ids({ view: 'upcoming' })).toEqual([6]);
  });

  it('excludes completed and dateless tasks from time views', () => {
    expect(ids({ view: 'today' })).not.toContain(7);
    expect(ids({ view: 'overdue' })).not.toContain(3);
  });

  it('sorts by due date ascending with nulls last', () => {
    const subset = [board[0], board[1], board[2]];
    const ordered = applyBoardQuery(subset, { sort: 'dueDate', dir: 'asc' }, TODAY).map(t => t.title);
    expect(ordered).toEqual(['Beta', 'Alpha informe', 'Gamma']);
  });

  it('sorts by priority descending', () => {
    const subset = [board[0], board[1], board[2]];
    const ordered = applyBoardQuery(subset, { sort: 'priority', dir: 'desc' }, TODAY).map(t => t.title);
    expect(ordered).toEqual(['Beta', 'Gamma', 'Alpha informe']);
  });

  it('does not mutate the input array order', () => {
    const input = [board[1], board[0], board[2]];
    const before = input.map(t => t.id);
    applyBoardQuery(input, { sort: 'title', dir: 'asc' }, TODAY);
    expect(input.map(t => t.id)).toEqual(before);
  });
});

// Mirrors TaskQueryIntegrationTest#boardQueryParityOrdering: the same fixture
// and query must yield the same order on the server spec and here.
describe('server/client ordering parity fixture', () => {
  const parityBoard: Task[] = [
    task({ title: 'Low', priority: Priority.LOW }),
    task({ title: 'High', priority: Priority.HIGH }),
    task({ title: 'Medium', priority: Priority.MEDIUM }),
  ];

  it('orders by priority desc so client matches the Java taskSpecification', () => {
    const ordered = applyBoardQuery(parityBoard, { sort: 'priority', dir: 'desc' }).map(t => t.title);
    expect(ordered).toEqual(['High', 'Medium', 'Low']);
  });
});

describe('boardQueryFrom', () => {
  const base: BoardFilters = { view: 'all', query: {}, tagFilter: [], projectFilter: '' };

  it('leaves project unset for the empty scope', () => {
    expect(boardQueryFrom(base).projectId).toBeUndefined();
  });

  it('maps the none scope', () => {
    expect(boardQueryFrom({ ...base, projectFilter: 'none' }).projectId).toBe('none');
  });

  it('coerces an id string to a number', () => {
    expect(boardQueryFrom({ ...base, projectFilter: '12' }).projectId).toBe(12);
  });

  it('carries the view, tag filter and query fields', () => {
    const query = boardQueryFrom({
      view: 'today',
      query: { q: 'x', priority: Priority.HIGH, sort: 'title', dir: 'asc' },
      tagFilter: [3, 4],
      projectFilter: '',
    });
    expect(query).toMatchObject({
      view: 'today',
      q: 'x',
      priority: Priority.HIGH,
      tagIds: [3, 4],
      sort: 'title',
      dir: 'asc',
    });
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
