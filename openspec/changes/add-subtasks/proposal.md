# Proposal

## Why

Larger tasks ("Organizar la mudanza") need to be broken into checkable steps. Today that only means either one big task or many unrelated ones. Block C (estructura): add subtasks so a task can carry its own checklist.

## What Changes

- A task gains an optional `parentId` (self-reference). Subtasks are ordinary tasks with a parent; nesting is one level only.
- The board lists top-level tasks only; subtasks are managed from the task's modal (add, toggle status, delete) and surfaced as progress (done/total) on the parent card.
- Endpoints: `GET /v1/tasks/{id}/subtasks`; subtasks are created via `POST /v1/tasks` with `parentId` in the body. Deleting a parent cascades to its subtasks.

**Non-goals:**
- Nested subtasks (grandchildren), subtask reordering, auto-completing the parent when all subtasks are done.

**Rollback plan:** remove the modal section, the progress indicator and the query, and drop `tasks.parent_id` (migration down). Subtasks become ordinary top-level tasks.

## Capabilities

### New Capabilities

- `subtasks`: attach one level of child tasks to a parent and track their progress.

### Modified Capabilities

- `task-management`: adds a "Task Subtask Assignment" requirement (optional `parentId`, cascade delete).

## Impact

- **Backend (Java):** `model/Task` (+`parentId`, cascade), `dto/TaskRequest`/`TaskResponse` (+`parentId`, `subtaskProgress`), `service/SubtaskService`, `controller/TaskController`, `repository/TaskRepository` (find by parent), migration `V8__add_subtasks.sql`.
- **Frontend (TS):** `frontend/src/components/AddTaskModal.tsx` (subtask list), `frontend/src/components/KanbanCard.tsx` (progress), `frontend/src/data/TaskRepository.ts`.
- **API:** additive; tasks without a parent behave as today.
