# Proposal

## Why

The `/v1/tasks` resource is served by four Spring beans (`TaskController` + `TaskService`, `TaskOrderingService`, `ReminderService`), so understanding one endpoint means jumping controller → one of three modules → `TaskResponse.of`. `TaskService` also carries listing methods no controller calls (`getAllTasks()` at :62, `getAllTasksByStatus(...)` at :69/:76 — dead public surface), and the controller holds query bounds/parsing (`page`/`size` checks, null-status guard) that belong with the query.

## What Changes

- Add a `TaskModule` facade whose small interface exposes the use cases: `list`, `get`, `create`, `update`, `changeStatus`, `reorder`, `delete`, `restore`, `subtasks`.
- Extract a `TaskAccess` module owning the shared `findById → 404 → requireOwned → 403` policy (today repeated in `TaskService`, `TaskOrderingService`, `ReminderService`, `TagService`, `ProjectService`).
- Add a `TaskStatus.parse` value operation (today duplicated in `TaskService.parseStatus` and `TaskQuery`).
- Delete the dead listing overloads; move query bounds into `TaskQuery`.

**Non-goals:** changing endpoints or JSON shapes; merging tag/project modules.

**Rollback plan:** revert to the current bean wiring; behavior identical.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. Behavior-preserving refactor; `skip_specs: true`.

## Impact

- **Backend (Java):** `controller/TaskController`, `service/{TaskService,TaskOrderingService,ReminderService}`, new `service/{TaskModule,TaskAccess}`, `model/TaskStatus` (`parse`), `dto/TaskQuery`.
