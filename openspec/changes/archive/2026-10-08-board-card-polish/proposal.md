# Proposal — Completed cards and inline-error feedback

## Why

Two board-polish gaps surfaced in manual testing: a completed task looks the
same as any other card apart from its column, and an inline "title required"
error (quick-add, and the task modal) persists while the user types, so it reads
as a stuck error.

## What Changes

- Completed cards get a distinct treatment: the title is struck through and the
  card is muted (theme tokens).
- The quick-add inline error clears as soon as the user edits the input.
- The task modal's title error clears as soon as the user edits the title.

**Non-goals:** changing completion behavior or the status workflow; disabling
completed cards; adding validation rules.

**Rollback plan:** revert the touched files. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds "Completed Task Treatment" and "Inline Validation
  Clears on Edit".

## Impact

- **Frontend (TS):** `frontend/src/components/KanbanCard.tsx` (+ `.module.css`),
  `frontend/src/components/QuickAddTask.tsx`,
  `frontend/src/components/useTaskForm.ts`, `frontend/src/components/AddTaskModal.tsx`,
  tests.
