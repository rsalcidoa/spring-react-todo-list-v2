# Proposal — Reordering should not require switching off the field sort

## Why

After the sort fix, a field sort disabled drag-and-drop with a hint to pick
`Manual`. That is a poor trade: the user expects to be able to drag at any time.
Dragging while sorted is unambiguous — the drop lands between the visible
neighbors — so it should just work and switch the board back to `Manual`.

## What Changes

- Card drag-and-drop stays enabled at all times.
- Dropping a card while a field sort is active reorders it (using the visible
  neighbors) and switches the sort control to `Manual`, so the manual order is
  what the board shows afterwards.
- Remove the "choose Manual to reorder" hint and the disabled-drag plumbing.

**Non-goals:** changing the sort options or the midpoint reorder math; keyboard
moves.

**Rollback plan:** revert the touched frontend files. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: `Board Sort Control` no longer disables drag;
  `Manual Ordering` documents the auto-switch.

## Impact

- **Frontend (TS):** `frontend/src/pages/TodoListPage.tsx`,
  `frontend/src/components/KanbanColumn.tsx`, `frontend/src/components/KanbanCard.tsx`,
  `frontend/src/pages/TodoListPage.module.css`, `frontend/src/i18n/{es,en}.ts`
  (drop the hint key), tests.
