# Task Status Specification

## Purpose
Provides Kanban board task lifecycle management with status field and drag-and-drop transitions between PENDING, ACTIVE, and COMPLETED states, including column filtering by status for visual organization.

## Requirements

### Requirement: Task Status Field
The system SHALL store and expose a `status` field on each task with exactly three allowed values: `PENDING`, `ACTIVE`, or `COMPLETED`. When creating a task without an explicit status value, the system MUST default to `PENDING`.

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
- **THEN** system rejects the request and returns 400 Bad Request

### Requirement: Status Values
The system SHALL enforce exactly three valid task status values: `PENDING`, `ACTIVE`, and `COMPLETED`. No other status enum values are permitted.

#### Scenario: Only valid status enums accepted
- **WHEN** user sends POST or PUT request to `/v1/tasks` with any status value other than PENDING, ACTIVE, or COMPLETED
- **THEN** system returns 400 Bad Request with a validation error

### Requirement: Column Filtering by Status
The system SHALL allow clients to filter task lists by status via an optional `status` query parameter on the GET `/v1/tasks` endpoint.

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

### Requirement: Task Update Includes Status
The system SHALL accept an optional `status` field in PUT requests to `/v1/tasks/{id}` and update the task's status accordingly. The status MUST transition atomically — only one status value may be stored per request.

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

### Requirement: PATCH Status Update Endpoint
The system SHALL accept PATCH requests to `/v1/tasks/{id}/status` with a `{"status": "VALUE"}` body. The status field MUST be validated with `@NotBlank` and must match one of the three allowed enum values (`PENDING`, `ACTIVE`, `COMPLETED`).

**ID**: REQ-STATUS-004
**Affected files**: 
- `com.example.todo.controller.TaskController.patchStatus()` — parameter `@Valid @RequestBody StatusUpdateRequest request` (added `@Valid`)
- `com.example.todo.dto.StatusUpdateRequest.java` — `@NotBlank(message = "Status must not be blank")` already present

#### Scenario: Valid PATCH status update succeeds
- **WHEN** authenticated user sends PATCH request to `/v1/tasks/{id}/status` with `{"status": "ACTIVE"}` for a valid task they own
- **THEN** system returns 200 OK with the updated task including `"status": "ACTIVE"`

#### Scenario: PATCH status blank rejected
- **WHEN** user sends PATCH request to `/v1/tasks/{id}/status` with `{"status": ""}` (empty string) or null body
- **THEN** system returns 400 Bad Request with field-level details `{"error":"Validation failed","errors":{"status":["Status must not be blank"]}}`

#### Scenario: PATCH invalid status value rejected
- **WHEN** user sends PATCH request to `/v1/tasks/{id}/status` with `{"status": "INVALID"}` (not a valid enum)
- **THEN** system returns 400 Bad Request with field-level details
