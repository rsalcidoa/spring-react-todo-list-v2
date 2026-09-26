export type DueState = 'overdue' | 'today' | 'future' | 'none';

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
