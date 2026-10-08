# Proposal

## Why

Deleting a task is irreversible: a misfired click (or a wrong card in a confirm dialog) loses the task and its tags forever. Block E (confianza): make deletion recoverable and give the user a short undo.

## What Changes

- Soft-delete tasks: `DELETE /v1/tasks/{id}` sets `deletedAt` instead of removing the row; deleted tasks are excluded from every listing and from `GET /{id}`.
- New `POST /v1/tasks/{id}/restore` clears `deletedAt` for an owned task.
- Frontend: after a delete, show an "Deshacer" action for a few seconds; activating it calls restore and re-inserts the task.

**Non-goals:**
- A trash/archive screen, undo for updates or status changes, scheduled purge of old soft-deleted rows.

**Rollback plan:** remove the restore endpoint and undo UI; existing soft-deleted rows can be hard-deleted in a one-off. Migration down drops `deleted_at`.

## Capabilities

### New Capabilities

- `task-recovery`: soft-delete and restore a task.

### Modified Capabilities

- `frontend-integration`: adds an "Undo Task Deletion" requirement.

## Impact

- **Backend (Java):** `model/Task` (+`deletedAt`), `service/TaskService` (delete sets the timestamp, restore clears it, listings filter it), `repository/TaskRepository`, `controller/TaskController`, migration `V10__add_task_soft_delete.sql`.
- **Frontend (TS):** `frontend/src/pages/TodoListPage.tsx` (undo affordance), `frontend/src/data/TaskRepository.ts` (restore).
- **API:** `DELETE` keeps returning 204; `GET` behaves as if the task were gone.
