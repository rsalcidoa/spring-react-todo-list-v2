# Spec Delta — task-status (query inválido estructurado)

## MODIFIED Requirements

### Requirement: Column Filtering by Status
The system SHALL allow clients to filter task lists by status via an optional `status` query parameter on the GET `/v1/tasks` endpoint. An invalid value SHALL be rejected with 400 Bad Request carrying the structured field-level body produced by the Task module's status operation (same contract as invalid status in POST/PUT/PATCH bodies), not a generic conversion error.

**Affected files**:
- `com.example.todo.controller.TaskController.getAllTasks()` — receives `status` as `String` and delegates parsing to the Task module
- `com.example.todo.service.TaskService.getAllTasksByStatus(String)` — parses via the single status operation; invalid value raises the typed failure
- `com.example.todo.exception.GlobalExceptionHandler` — existing structured 400 mapping (unchanged)

#### Scenario: Filter tasks by PENDING status
- **WHEN** user sends GET request to `/v1/tasks?status=PENDING`
- **THEN** system returns 200 OK with only tasks matching `status = PENDING`

#### Scenario: Filter tasks by ACTIVE status
- **WHEN** user sends GET request to `/v1/tasks?status=ACTIVE`
- **THEN** system returns 200 OK with only tasks matching `status = ACTIVE`

#### Scenario: Filter tasks by COMPLETED status
- **WHEN** user sends GET request to `/v1/tasks?status=COMPLETED`
- **THEN** system returns 200 OK with only tasks matching `status = COMPLETED`

#### Scenario: No filter returns all statuses
- **WHEN** user sends GET request to `/v1/tasks` without a `status` query parameter
- **THEN** system returns 200 OK with all task statuses (backward compatible)

#### Scenario: Invalid status filter rejected with field-level details
- **WHEN** user sends GET request to `/v1/tasks?status=INVALID`
- **THEN** system returns 400 Bad Request with field-level details `{"error":"Validation failed","errors":{"status":["Status must be PENDING, ACTIVE or COMPLETED"]}}`
