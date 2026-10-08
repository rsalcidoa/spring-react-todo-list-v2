# Task Status Specification

## Purpose
Provides Kanban board task lifecycle management with status field and drag-and-drop transitions between PENDING, ACTIVE, and COMPLETED states, including column filtering by status for visual organization.

## Requirements

### Requirement: Task Status Field
The system SHALL store and expose a `status` field on each task with exactly three allowed values: `PENDING`, `ACTIVE`, or `COMPLETED`. When creating a task without an explicit status value, the system MUST default to `PENDING`. An invalid status value on any task mutation request is rejected with 400 Bad Request with field-level details.

**ID**: REQ-STATUS-001
**Affected files**:
- `com.example.todo.service.TaskService` — parses status input into the `TaskStatus` enum inside the module; invalid value → typed failure
- `com.example.todo.exception.GlobalExceptionHandler` — maps the typed failure to structured 400 with field-level details

#### Scenario: Default status is PENDING on creation
- **WHEN** user sends POST request to `/v1/tasks` without a `status` field in the request body
- **THEN** system stores the task with `status = PENDING`
- **AND** system returns 201 Created with the new task including `status: "PENDING"`

#### Scenario: Explicit status on creation
- **WHEN** user sends POST request to `/v1/tasks` with `"status": "ACTIVE"` in the request body
- **THEN** system stores the task with `status = ACTIVE`
- **AND** system returns 201 Created with the new task including `status: "ACTIVE"`

#### Scenario: Invalid status value rejected
- **WHEN** user sends POST or PUT request to `/v1/tasks` with `"status": "INVALID"` in the request body
- **THEN** system rejects the request and returns 400 Bad Request with field-level details `{"error":"Validation failed","errors":{"status":["Status must be PENDING, ACTIVE or COMPLETED"]}}`

### Requirement: Status Values
The system SHALL enforce exactly three valid task status values: `PENDING`, `ACTIVE`, and `COMPLETED`. No other status enum values are permitted.

#### Scenario: Only valid status enums accepted
- **WHEN** user sends POST or PUT request to `/v1/tasks` with any status value other than PENDING, ACTIVE, or COMPLETED
- **THEN** system returns 400 Bad Request with a validation error

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

### Requirement: Task Update Includes Status
The system SHALL accept an optional `status` field in PUT requests to `/v1/tasks/{id}` and update the task's status accordingly. The status MUST transition atomically — only one status value may be stored per request. Both the full update (PUT) and the status-only update (PATCH) SHALL share the same strict parsing (`parseStatus`) and the same failure behavior: the PATCH entry point delegates to the single status operation of the Task module (`applyStatus`), while PUT parses inline during field application. No second status operation exists on the module.

**ID**: REQ-STATUS-002
**Affected files**:
- `com.example.todo.service.TaskService.applyStatus(Long id, String status)` — status operation used by the PATCH entry point; PUT shares its parsing via `parseStatus`
- `com.example.todo.controller.TaskController.updateTask()` / `patchStatus()` — thin delegates, no manual enum parsing

#### Scenario: Transition PENDING to ACTIVE
- **WHEN** user sends PUT request to `/v1/tasks/123` with `"status": "ACTIVE"` in the body
- **THEN** system updates task 123 to `status = ACTIVE`
- **AND** returns 200 OK with the updated task

#### Scenario: Transition ACTIVE to COMPLETED
- **WHEN** user sends PUT request to `/v1/tasks/123` with `"status": "COMPLETED"` in the body
- **THEN** system updates task 123 to `status = COMPLETED`
- **AND** returns 200 OK with the updated task

#### Scenario: Task response includes status
- **WHEN** user sends any request that returns a task object (GET, POST, PUT)
- **THEN** the returned JSON includes `"status": "<value>"` in every response

#### Scenario: PUT with invalid status rejected with field-level details
- **WHEN** user sends PUT request to `/v1/tasks/123` with `"status": "INVALID"` in the body
- **THEN** system returns 400 Bad Request with field-level details `{"error":"Validation failed","errors":{"status":["Status must be PENDING, ACTIVE or COMPLETED"]}}`
- **AND** the task is not modified

### Requirement: PATCH Status Update Endpoint
The system SHALL accept PATCH requests to `/v1/tasks/{id}/status` with a `{"status": "VALUE"}` body. The status field MUST be validated with `@NotBlank` and must match one of the three allowed enum values (`PENDING`, `ACTIVE`, `COMPLETED`). An invalid value is rejected with 400 Bad Request with field-level details produced by the Task module's status operation, not by the controller.

**ID**: REQ-STATUS-004
**Affected files**:
- `com.example.todo.controller.TaskController.patchStatus()` — delegates to `TaskService.applyStatus`
- `com.example.todo.service.TaskService.applyStatus(Long id, String status)` — typed parsing + atomic set
- `com.example.todo.exception.GlobalExceptionHandler` — structured 400 mapping

#### Scenario: Valid PATCH status update succeeds
- **WHEN** authenticated user sends PATCH request to `/v1/tasks/{id}/status` with `{"status": "ACTIVE"}` for a valid task they own
- **THEN** system returns 200 OK with the updated task including `"status": "ACTIVE"`

#### Scenario: PATCH status blank rejected
- **WHEN** user sends PATCH request to `/v1/tasks/{id}/status` with `{"status": ""}` (empty string) or null body
- **THEN** system returns 400 Bad Request with field-level details `{"error":"Validation failed","errors":{"status":["Status must not be blank"]}}`

#### Scenario: PATCH invalid status value rejected
- **WHEN** user sends PATCH request to `/v1/tasks/{id}/status` with `{"status": "INVALID"}` (not a valid enum)
- **THEN** system returns 400 Bad Request with field-level details `{"error":"Validation failed","errors":{"status":["Status must be PENDING, ACTIVE or COMPLETED"]}}`

### Requirement: Recurring Generation on Completion
When a task with a non-`NONE` recurrence transitions to `COMPLETED`, the system SHALL create exactly one next occurrence: a new task owned by the same user, status `PENDING`, the rule's next `dueDate`, and the same title, description, priority, tags and recurrence. The new task SHALL record `recurrenceSourceId` pointing at the completed task. Re-completing a task that already produced its next occurrence SHALL NOT create a duplicate. If the task has a `reminderAt`, it SHALL be shifted by the same date delta as the due date.

**ID**: REQ-STATUS-005
**Affected files**:
- `com.example.todo.service.TaskService` — on `applyStatus`/`updateTask` transition to COMPLETED, generate the next occurrence exactly once
- `com.example.todo.repository.TaskRepository` — lookup by `recurrenceSourceId` to guard duplicates
- `com.example.todo.model.Task` — `recurrenceSourceId`

#### Scenario: Completing a recurring task creates the next one
- **WHEN** a `WEEKLY` task with due date `2026-01-01` is moved to `COMPLETED`
- **THEN** a new `PENDING` task appears with due date `2026-01-08`, the same fields and tags, and `recurrenceSourceId` set to the completed task

#### Scenario: No duplicate on re-completion
- **WHEN** the completed task is set to `COMPLETED` again (or re-saved without a status change)
- **THEN** no additional occurrence is created

#### Scenario: Non-recurring tasks are unaffected
- **WHEN** a task with `recurrence: NONE` is completed
- **THEN** no new task is created
