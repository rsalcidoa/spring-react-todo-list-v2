/**
 * Position between two neighbors for manual ordering. Uses a double so an
 * insert between two cards does not rewrite the rest of the column.
 */
export function positionBetween(before?: number, after?: number): number {
  if (before == null && after == null) return 1;
  if (before == null) return (after as number) - 1;
  if (after == null) return before + 1;
  return (before + after) / 2;
}
