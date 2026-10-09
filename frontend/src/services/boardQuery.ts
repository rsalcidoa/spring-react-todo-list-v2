import { Task, TaskStatus, Priority, TaskSort, SortDir, TaskQuery } from './types/task';

/**
 * Which tasks the board shows and in what order — selection, ordering and the
 * Due-state rules — plus the coercion from the UI filters. The single
 * client-side answer for a query, used both by the in-memory adapter and (for
 * optimistic overlays) by the board controller. The server's
 * `taskSpecification` + `applyOrdering` mirror the search/priority/tags and
 * ordering fields; Project scope and date Views are computed here, client-side,
 * over the already-loaded tasks (REQ-FE-019 / REQ-FE-037).
 */

export type BoardView = 'all' | 'today' | 'overdue' | 'upcoming';
export type DueState = 'overdue' | 'today' | 'future' | 'none';

export interface BoardQuery {
  q?: string;
  priority?: Priority;
  status?: TaskStatus;
  tagIds?: number[];
  projectId?: number | 'none';
  view?: BoardView;
  sort?: TaskSort;
  dir?: SortDir;
}

/** The board's read filters as the UI holds them (project is a string). */
export interface BoardFilters {
  view: BoardView;
  query: TaskQuery;
  tagFilter: number[];
  projectFilter: string;
}

/** Coerces the UI filters into the domain query. */
export function boardQueryFrom(filters: BoardFilters): BoardQuery {
  return {
    view: filters.view,
    q: filters.query.q,
    priority: filters.query.priority,
    status: filters.query.status,
    tagIds: filters.tagFilter,
    projectId: filters.projectFilter === ''
      ? undefined
      : filters.projectFilter === 'none'
        ? 'none'
        : Number(filters.projectFilter),
    sort: filters.query.sort,
    dir: filters.query.dir,
  };
}

const PRIORITY_RANK: Record<Priority, number> = {
  [Priority.LOW]: 0,
  [Priority.MEDIUM]: 1,
  [Priority.HIGH]: 2,
};

/** Board ordering for a query; `dueDate` keeps dateless tasks last either way. */
export function compareTasks(a: Task, b: Task, sort?: TaskSort, dir?: SortDir): number {
  const field = sort ?? 'createdAt';
  const direction = dir ?? (field === 'createdAt' ? 'desc' : 'asc');
  let result: number;
  switch (field) {
    case 'priority':
      result = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      break;
    case 'title':
      result = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      break;
    case 'dueDate': {
      const ad = a.dueDate;
      const bd = b.dueDate;
      if (!ad && !bd) return 0;
      if (!ad) return 1; // dateless tasks last, regardless of direction
      if (!bd) return -1;
      result = ad.localeCompare(bd);
      break;
    }
    default:
      result = (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
  }
  return direction === 'desc' ? -result : result;
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

/** Selects and orders the board's visible tasks for a query. */
export function applyBoardQuery(tasks: Task[], query: BoardQuery = {}, today?: string): Task[] {
  let items = filterByView(tasks, query.view ?? 'all', today);

  if (query.q) {
    const needle = query.q.toLowerCase();
    items = items.filter(t =>
      t.title.toLowerCase().includes(needle) || (t.description ?? '').toLowerCase().includes(needle));
  }
  if (query.priority) {
    items = items.filter(t => t.priority === query.priority);
  }
  if (query.status) {
    items = items.filter(t => t.status === query.status);
  }
  if (query.tagIds && query.tagIds.length > 0) {
    const tagIds = query.tagIds;
    items = items.filter(t => t.tags.some(tag => tagIds.includes(tag.id)));
  }
  if (query.projectId === 'none') {
    items = items.filter(t => t.projectId == null);
  } else if (query.projectId !== undefined) {
    items = items.filter(t => t.projectId === query.projectId);
  }

  return [...items].sort((a, b) => compareTasks(a, b, query.sort, query.dir));
}
