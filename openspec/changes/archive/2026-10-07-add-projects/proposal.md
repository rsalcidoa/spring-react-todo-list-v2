# Proposal

## Why

Tags are the only way to group tasks, and they are cross-cutting labels, not containers. Users need a first-class way to separate work areas ("Trabajo", "Casa", "Side project"). Block C (estructura): add a Project container a task belongs to.

## What Changes

- New capability `projects`: a user-scoped `Project` (id, name) with `GET/POST/PUT/DELETE /v1/projects`, case-insensitive unique name per user, ownership via the shared seam.
- A task gains an optional `projectId`. Deleting a project unassigns it from its tasks (tasks are not deleted), mirroring tag deletion.
- Frontend: a project selector/filter in the board header and a project field in the task modal.

**Non-goals:**
- Sharing projects between users, nested projects, per-project members or roles, project archival.

**Rollback plan:** remove the UI and endpoints and drop the `projects` table plus `tasks.project_id` (migration down). Tasks are untouched by rollback.

## Capabilities

### New Capabilities

- `projects`: create, list, rename and delete user-scoped project containers.

### Modified Capabilities

- `task-management`: adds a "Task Project Assignment" requirement (optional `projectId`).

## Impact

- **Backend (Java):** new `model/Project`, `repository/ProjectRepository`, `service/ProjectService`, `controller/ProjectController`, `dto/ProjectRequest`/`ProjectResponse`; `model/Task` + `TaskRequest`/`TaskResponse` gain `projectId`; migration `V7__add_projects.sql`.
- **Frontend (TS):** `frontend/src/data/TaskRepository.ts` (project ops), `frontend/src/services/ApiService.ts`, `frontend/src/pages/TodoListPage.tsx`, `frontend/src/components/AddTaskModal.tsx`.
- **API:** additive; tasks without a project behave as today.
