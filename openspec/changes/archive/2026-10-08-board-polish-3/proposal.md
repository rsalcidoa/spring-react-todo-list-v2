# Proposal — Header project action and drag feedback

## Why

Two small board issues: the "New project" action is only inside the project
selector/empty state, not next to "New task"; and a column's drag-over
highlight stays painted after a drop, so it lingers until the next drag.

## What Changes

- Add a "New project" action in the header actions, next to "New task" and the
  user avatar, opening the Manage projects dialog.
- Fix the drag-over highlight: drive it with React state so it clears on drop
  and on drag-leave (no stale highlighted column).

**Non-goals:** changing drag-and-drop behavior; the project selector/empty-state
entry points stay.

**Rollback plan:** revert the header and `KanbanColumn` changes. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds "Header Project Action and Drag Feedback".

## Impact

- **Frontend (TS):** `frontend/src/pages/TodoListPage.tsx`,
  `frontend/src/components/KanbanColumn.tsx`, tests, visual baselines.
