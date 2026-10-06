# Proposal

## Why

`GET /v1/tasks` returns every task at once. With hundreds of tasks the payload and render cost grow unbounded. Block F (alcance): bound the listing without breaking existing clients.

## What Changes

- Add optional `page` (0-based) and `size` query parameters to `GET /v1/tasks`. When present, the response SHALL be a page envelope `{ "items": [...], "page": n, "size": s, "total": t }`; when absent, the response SHALL remain the plain array (backward compatible).
- Pagination composes with the search/sort/filter parameters from `add-task-query`.
- Frontend: the board loads a page at a time with a "Cargar más" action; the repository exposes `fetchPage(query, page, size)`.

**Non-goals:**
- Cursor-based pagination, virtualized rendering, changing the default (no-params) response shape.

**Rollback plan:** remove the page handling and the "Cargar más" action; the array response is unchanged. No schema change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `task-management`: adds a "Paginated Task Listing" requirement.
- `frontend-integration`: adds a "Paginated Board Loading" requirement.

## Impact

- **Backend (Java):** `com.example.todo.controller.TaskController.getAllTasks()`, `com.example.todo.service.TaskService` (Pageable), `com.example.todo.dto.PageResponse`.
- **Frontend (TS):** `frontend/src/data/TaskRepository.ts`, `frontend/src/services/ApiService.ts`, `frontend/src/pages/TodoListPage.tsx`.
- **API:** additive; clients that omit the params are unaffected.
