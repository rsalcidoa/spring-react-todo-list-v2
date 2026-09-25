# Spec Delta

## Purpose

Provides Kanban board task lifecycle management with status field and drag-and-drop transitions between PENDING, ACTIVE, and COMPLETED states, including column filtering by status for visual organization.

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Create Task (from task-management spec)
The system SHALL allow users to create a new task with title, description, priority, due date, and status. The `status` field defaults to PENDING if not specified.

#### Scenario: Successful Task Creation with Default Status
- **WHEN** user sends POST request to `/v1/tasks` with valid task data omitting the `status` field
- **THEN** system returns 201 Created with the created task including `"status": "PENDING"`

#### Scenario: Successful Task Creation with Explicit Active Status
- **WHEN** user sends POST request to `/v1/tasks` with `"status": "ACTIVE"` included in valid task data
- **THEN** system returns 201 Created with the created task including `"status": "ACTIVE"`

### Requirement: Update Task (from task-management spec)
The system SHALL allow users to update an existing task's title, description, priority, due date, and status. The `status` field is optional; omitting it leaves the current status unchanged.

#### Scenario: Successful Task Update with Status Change
- **WHEN** user sends PUT request to `/v1/tasks/{id}` with `"status": "COMPLETED"` in the body alongside other fields
- **THEN** system returns 200 OK with the updated task reflecting the new status value

### Requirement: List All Tasks (from task-management spec)
The system SHALL allow users to retrieve all tasks. The GET `/v1/tasks` endpoint now supports an optional `status` query parameter for filtered retrieval. When no filter is specified, behavior remains unchanged from existing clients.

#### Scenario: Successful Task Listing with Status Filter
- **WHEN** user sends GET request to `/v1/tasks?status=PENDING`
- **THEN** system returns 200 OK with an array containing only tasks matching the `PENDING` status filter

### Requirement: Update Task (from task-management spec — response now includes status)
The system SHALL return all task fields including `status` in every response. Tasks created before this change default to PENDING.

#### Scenario: Updated task response includes status field
- **WHEN** user sends GET request to `/v1/tasks/{id}` for any existing task
- **THEN** the returned JSON object includes a `"status"` field with value `PENDING`, `ACTIVE`, or `COMPLETED`
