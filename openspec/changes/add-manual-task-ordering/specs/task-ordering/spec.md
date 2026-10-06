# Spec Delta

## Purpose

Persists a manual order for tasks inside their status column so users can arrange a column by importance.

## ADDED Requirements

### Requirement: Task Position Within Status
Each task SHALL carry a `position` value that orders it within its status column. A task response SHALL echo `position`. When two tasks share a position, the tie SHALL be broken by `createdAt`. Existing tasks SHALL be treated as `position = 0` after migration, preserving their current order.

**ID**: REQ-ORD-001
**Affected files**:
- `com.example.todo.model.Task` — `position` (double)
- `com.example.todo.dto.TaskResponse` — echoes `position`
- `backend/src/main/resources/db/migration/V9__add_task_position.sql`

#### Scenario: Position is echoed
- **WHEN** any endpoint returns a task
- **THEN** the response includes its `position`

#### Scenario: Ties break by creation time
- **WHEN** two tasks in a column share the same `position`
- **THEN** the older task sorts first

### Requirement: Reorder Endpoint
The system SHALL accept `PATCH /v1/tasks/{id}/position` with `{"status": "...", "position": <number>}` to set a task's status and position atomically. The status SHALL be one of the three valid values and `position` SHALL be a finite number; invalid input returns 400 Bad Request with the structured `{error, errors}` body. Ownership and not-found SHALL follow the shared task rules (403/404).

**ID**: REQ-ORD-002
**Affected files**:
- `com.example.todo.controller.TaskController.patchPosition()`
- `com.example.todo.service.TaskOrderingService.reorder(id, status, position)`
- `com.example.todo.dto.PositionUpdateRequest`

#### Scenario: Reorder within a column
- **WHEN** the user sends a valid `{status, position}` for their task
- **THEN** system returns 200 OK with the task at the new status and position

#### Scenario: Invalid position rejected
- **WHEN** the user sends a non-numeric or non-finite position, or an invalid status
- **THEN** system returns 400 Bad Request with the structured body naming the offending field

#### Scenario: Reorder respects ownership
- **WHEN** the user reorders another user's task
- **THEN** system returns 403 Forbidden; a missing id returns 404
