# Proposal — Deleting a project deletes its tasks

## Why

Deleting a project currently leaves its tasks behind, unassigned. The user
expects deleting a project to remove its tasks too.

## What Changes

- `ProjectService.delete` deletes every task belonging to the project (and their
  subtasks, via the `parent_id` cascade) before deleting the project.
- The delete confirmation SHALL warn that the project's tasks will be deleted,
  and the board SHALL drop those tasks from its state.

**Non-goals:** changing task soft-delete/undo for individual tasks; changing
`project_id` ownership rules.

**Rollback plan:** revert the service/tests and the frontend confirm; tasks
return to being left unassigned. Backend + frontend.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `projects`: `Delete User Project` SHALL delete the project's tasks (and
  subtasks).

## Impact

- **Backend (Java):** `service/ProjectService`, `repository/TaskRepository`,
  project tests.
- **Frontend (TS):** `pages/useBoard.ts` (`deleteProject` removes the tasks),
  `components/ManageProjectsModal.tsx` (confirmation copy), i18n, tests.
