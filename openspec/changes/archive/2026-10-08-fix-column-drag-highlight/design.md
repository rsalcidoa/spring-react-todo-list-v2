# Design

## Context

See `proposal.md` — Why. `KanbanColumn.tsx` owns the drag-over highlight with a
boolean `dragOver` set on `onDragOver` and cleared on `onDragLeave`. The body
contains children (a `QuickAddTask` form and the cards), so `dragleave` fires as
the drag target changes between the body and its children.

## Goals / Non-Goals

**Goals:**
- Keep the highlight while the pointer is anywhere inside the column.
- Clear it when the pointer truly leaves or the card is dropped.
- Keep the existing drop/reorder behavior.

**Non-Goals:**
- A drop indicator between cards.
- Reading `relatedTarget` (unreliable for drag events in Chromium).

## Decisions

1. **Depth counter on `dragenter`/`dragleave`.** `dragDepth` increments on
   `dragenter` and decrements on `dragleave`; the state clears only at zero.
   - Rationale: enter/leave events pair per element and bubble, so the depth stays
     positive while the pointer is inside the column and its children — the
     canonical nested drag-and-drop fix.
   - Alternative: guard `dragleave` with `currentTarget.contains(relatedTarget)` —
     rejected: `relatedTarget` is often `null` for drag events in Chromium.
2. **`onDragOver` also sets the highlight** and calls `preventDefault()`.
   - Rationale: it is the drop-target enabler and keeps the existing tests that
     drive `dragover` valid; setting the same state value is a no-op for React.
3. **`onDrop` resets the depth to zero and clears the highlight**, so a drop never
   leaves a stale highlight.

## Risks / Trade-offs

- [A cancelled drag (Esc) may not decrement every level] → the eventual
  `dragleave` when the pointer leaves resets to zero; a drop also resets. Acceptable
  for this UI; a `dragend` listener can be added later if needed.
- [Test churn] → existing drag tests keep working (dragOver sets the highlight,
  dragLeave at depth 0 clears it).

## Migration Plan

Frontend-only; no data or API change. Build with `npm run build`. Rollback returns
to the boolean state.

## Test Strategy

- **Component (Vitest):** extend `TodoListPage.test.tsx` — a `dragenter` on a child
  does not clear the highlight, and leaving the column clears it; the existing
  drag-over/drop cases stay green.
- **E2E (Playwright):** no resting-state change; the visual baselines are unaffected.
- **Backend:** none.
