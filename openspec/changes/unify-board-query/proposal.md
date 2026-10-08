# Proposal

## Why

"Which tasks the board shows" is decided in five places: the server `taskSpecification`/`applyOrdering`, `InMemoryTaskRepository.fetchAll` + `compareTasks`, `boardView.filterByView`, and the page's tag/project filter and column grouping/sort. The same sort semantics exist in Java and TS with different defaults and date handling, so a change to ordering risks drifting between client and backend.

## What Changes

- Add a `BoardQuery` value with a single `apply(tasks)` (used by the in-memory adapter and client-side view) and a server-side equivalent in the task query.
- Have the page send all filters to the repository and treat the returned page as canonical; keep client filtering only for optimistic overlays.
- Move the date/view rules next to the query; delete the duplicate filtering passes.

**Non-goals:** changing the wire contract or pagination shape; adding filters.

**Rollback plan:** revert to the current split filtering; behavior identical.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. Behavior-preserving refactor; `skip_specs: true`.

## Impact

- **Frontend (TS):** new `frontend/src/services/boardQuery.ts`, `frontend/src/pages/TodoListPage.tsx`, `frontend/src/services/boardView.ts`, `frontend/src/data/TaskRepository.ts`.
- **Backend (Java):** `service/TaskService` (`taskSpecification`/`applyOrdering`), `dto/TaskQuery`.
