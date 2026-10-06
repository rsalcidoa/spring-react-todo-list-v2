# Proposal

## Why

`GET /v1/tasks` returns every task of the user, unsorted and unfiltered beyond `status`. As the board grows past a few dozen tasks, users cannot find a task or bring the urgent ones to the top. This is block A/D of the roadmap: make the existing data findable and focal before adding more features on top.

## What Changes

- Extend `GET /v1/tasks` with optional, composable query parameters: `q` (case-insensitive search over title + description), `priority` (`LOW|MEDIUM|HIGH`), `tagIds` (repeatable; ANY-match), `sort` (`createdAt|dueDate|priority|title`) and `dir` (`asc|desc`). `status` keeps working.
- Introduce a single `TaskQuery` value object parsed and validated inside the Task module, so invalid values reuse the existing typed-failure -> structured 400 contract instead of a controller conversion error.
- Frontend: a debounced search box plus sort (field + direction) and priority controls in the board header. `TaskRepository.fetchAll(query?)` forwards the query to the API; `TodoListPage` owns the query state.

**Non-goals:**
- Pagination / virtualization (block F), a full-text search engine, saved filters, or multi-key sort.
- Changing the existing `status` filter semantics or the default (no-params) response.

**Rollback plan:** revert the controller/service/repository query additions and the header controls. No schema or Flyway change, so rollback is code-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `task-management`: the "List All Tasks" requirement gains search, priority/tag filtering and sorting, with structured 400s for invalid values.
- `frontend-integration`: the board list gains search/sort/priority controls backed by `TaskRepository.fetchAll(query?)`.

## Impact

- **Backend (Java):** `com.example.todo.controller.TaskController.getAllTasks`, `com.example.todo.service.TaskService` (new `TaskQuery` seam), `com.example.todo.repository.TaskRepository` (query method).
- **Frontend (TS):** `frontend/src/data/TaskRepository.ts`, `frontend/src/services/ApiService.ts`, `frontend/src/services/types/task.ts`, `frontend/src/pages/TodoListPage.tsx`, new board-header controls.
- **API:** additive and backward compatible; omitted parameters keep today's behavior.
