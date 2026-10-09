# Proposal

## Why

Dragging a card vertically inside a column makes the column's drag-over
highlight blink. The highlight is toggled by `dragover`/`dragleave` on the column
body, but `dragleave` also fires every time the drag target moves from the body
onto one of its children (the quick-add input/button and the cards). So the
`dragover` class is added and removed many times per second — visually broken and
distracting.

## What Changes

- **Track drag depth instead of a boolean.** `KanbanColumn` increments a depth on
  `dragenter` and decrements on `dragleave`, showing the highlight while the depth
  is greater than zero and clearing it only when it reaches zero (or on drop).
- **`dragover` keeps reinforcing the highlight** so the behavior and the existing
  tests (which drive `dragover`/`dragleave`) remain valid.
- **No change to the drop/reorder behavior** or the highlight's appearance.

**Non-goals**:
- A drop-position indicator line between cards (separate feature).
- Changing the drag payload, the reorder math or the drop target.

**Scope**: `frontend/src`.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `frontend-integration`: REQ-FE-039 (Header Project Action and Drag Feedback) is
  extended with a scenario pinning a stable highlight while dragging within a
  column.

## Impact

Affected files:
- `frontend/src/components/KanbanColumn.tsx` — depth-based drag-over state.
- `frontend/src/__tests__/TodoListPage.test.tsx` — drag-highlight cases.

No API, dependency, or behavior change beyond the flicker fix. Aligns the board
with REQ-FE-039 ("only while a card is dragged over it").

**Rollback plan**: restore the boolean `dragOver` state.

> Sixth of the deepenings; a focused UI bug fix, independent of the rest.
