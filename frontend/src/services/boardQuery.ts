import { Task, TaskStatus, Priority, TaskSort, SortDir } from './types/task';
import { filterByView, type BoardView } from './boardInteraction';

/**
 * Which tasks the board shows and in what order. The single client-side
 * answer for a query, used both by the in-memory adapter and (for optimistic
 * overlays) by the board controller. The server's `taskSpecification` +
 * `applyOrdering` mirror these fields; sort/view defaults are documented once
 * here.
 */
export interface BoardQuery {
  q?: string;
  priority?: Priority;
  status?: TaskStatus;
  tagIds?: number[];
  projectId?: number;
  view?: BoardView;
  sort?: TaskSort;
  dir?: SortDir;
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
  if (query.projectId !== undefined) {
    items = items.filter(t => t.projectId === query.projectId);
  }

  return [...items].sort((a, b) => compareTasks(a, b, query.sort, query.dir));
}
