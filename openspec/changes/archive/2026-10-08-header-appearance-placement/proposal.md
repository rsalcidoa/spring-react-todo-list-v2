# Proposal — Place the appearance controls with the header actions

## Why

The language and theme selectors currently sit at the end of the filter row,
mixed with the task filters even though they affect the whole app. They belong
with the account/action controls on the right, below the "New task" button and
the user avatar.

## What Changes

- Move the language and theme selectors out of the filter row into a
  right-aligned group beneath the user actions (New task + avatar).
- Keep the filters (search, view, project, priority, sort) on their own row.

**Non-goals:** changing filter behavior; new controls.

**Rollback plan:** revert the two files touched. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: `Task List View` — the header groups the appearance
  controls (language, theme) with the actions, separate from the filters.

## Impact

- **Frontend (TS):** `frontend/src/pages/TodoListPage.tsx` (+ `.module.css`),
  tests, visual baselines.
