# Design

## Context

See `proposal.md` — Why. Deletion test: deleting any single helper moves 1–5 lines into a caller; the concepts should merge upward, not be re-extracted.

## Goals / Non-Goals

**Goals:**
- One module for board interactions with a small interface; trivial math private.

**Non-Goals:**
- New interactions; visual changes.

## Decisions

1. **A `BoardInteraction` module** (chosen) exposing cohesive operations: `dropIndex(clientY, rects)`, `keyboardTarget(status, direction)`, `restoreFocus(id)`, `dueChip(dueDate, today, lang)`.
   - Alternative: leave the helpers separate — rejected: shallow, no locality.
2. **Fold `boardKeyboard`/`taskOrdering`/`boardView`/`dueState` in as private implementation** (chosen).
3. **Move their unit tests** to `boardInteraction.test.ts` (same assertions, one module).

## Seam and interface

```
BoardInteraction: {
  dropIndex(clientY, cards): number
  keyboardTarget(status, direction): TaskStatus | null
  restoreFocus(taskId): void
  dueState(dueDate, today?): 'overdue'|'today'|'future'|'none'
}
```

## Risks / Trade-offs

- [Merging unrelated math] -> only interaction-shaped operations go in; pure formatters stay where they are unless they serve the interaction.
- [Test churn] -> move tests, keep assertions.

## Test Strategy

- Unit: `boardInteraction.test.ts` (same cases as the retired helper tests).
- Regression: `TodoListPage.test.tsx` (drag/keyboard) stays green.
