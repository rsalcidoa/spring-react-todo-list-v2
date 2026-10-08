# task-recovery Specification

## Purpose
Makes task deletion recoverable with a soft-delete flag and a restore operation, so a misfired delete does not lose work.

## Requirements

### Requirement: Soft Delete Task
`DELETE /v1/tasks/{id}` SHALL mark the task's `deletedAt` instead of physically removing the row, scoped to the owner through the shared seam. Soft-deleted tasks SHALL be excluded from every listing and from `GET /v1/tasks/{id}` (which returns 404). The endpoint SHALL still return 204 No Content.

**ID**: REQ-REC-101
**Affected files**:
- `com.example.todo.model.Task` — `deletedAt` (timestamp, nullable)
- `com.example.todo.service.TaskService.deleteTask()` — sets `deletedAt` via the module's clock
- `com.example.todo.repository.TaskRepository` — listings filter `deletedAt is null`
- `backend/src/main/resources/db/migration/V10__add_task_soft_delete.sql`

#### Scenario: Delete hides the task
- **WHEN** the user deletes a task
- **THEN** system returns 204 and the task no longer appears in listings or `GET /{id}`

#### Scenario: Deleted task is not found
- **WHEN** the user requests a soft-deleted task by id
- **THEN** system returns 404 Not Found

### Requirement: Restore Task
`POST /v1/tasks/{id}/restore` SHALL clear `deletedAt` for an owned, soft-deleted task and return 200 OK with the task. Restoring a task that is not deleted SHALL be idempotent (200, unchanged). A non-existent id returns 404; another user's task returns 403.

**ID**: REQ-REC-102
**Affected files**:
- `com.example.todo.controller.TaskController.restoreTask()`
- `com.example.todo.service.TaskService.restoreTask()`

#### Scenario: Restore a deleted task
- **WHEN** the user restores a soft-deleted task
- **THEN** system returns 200 and the task reappears in listings

#### Scenario: Restore respects ownership
- **WHEN** the user restores another user's task
- **THEN** system returns 403 Forbidden; a missing id returns 404
