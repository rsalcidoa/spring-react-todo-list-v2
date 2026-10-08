import { describe, it, expect } from 'vitest';
import { applyBoardQuery, type BoardQuery } from '../services/boardQuery';
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
