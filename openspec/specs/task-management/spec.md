# task-management Specification

## Purpose
Provides CRUD operations for managing tasks with priority levels, due dates, status transitions, and user-scoped tagging.

## Requirements

### Requirement: Create Task
The system SHALL allow users to create a new task with title, description, priority, optional due date, optional status (defaults to PENDING if omitted), and optional tags (`tagNames[]`). When `tagNames` is provided, each name is resolved from the user's tag scope or created automatically.

#### Scenario: Successful Task Creation
- **WHEN** user sends POST request to /v1/tasks with valid task data including title, description, priority
- **THEN** system returns 201 Created with the created task including `"status": "PENDING"` and empty `tags` array

#### Scenario: Successful Task Creation with Default Status
- **WHEN** user sends POST request to /v1/tasks with valid task data omitting the status field
- **THEN** system stores the task with default `status = PENDING`
- **AND** returns 201 Created with the created task including `"status": "PENDING"`

#### Scenario: Successful Task Creation with Explicit Status
- **WHEN** user sends POST request to /v1/tasks with valid task data and `"status": "ACTIVE"` in the body
- **THEN** system stores the task with `status = ACTIVE`
- **AND** returns 201 Created with the created task including `"status": "ACTIVE"`

#### Scenario: Successful Task Creation with Tags
- **WHEN** user sends POST request to /v1/tasks with valid task data and `"tagNames": ["Work"]` in the body where `Work` already exists as a tag for that user
- **THEN** system assigns the existing `Work` tag to the new task
- **AND** returns 201 Created with the created task including `"tags": [{"name": "Work"}]`

#### Scenario: Successful Task Creation with Auto-created Tags
- **WHEN** user sends POST request to /v1/tasks with valid task data and `"tagNames": ["NewCategory"]` where `NewCategory` does not yet exist for that user
- **THEN** system creates the tag under the user's account, assigns it to the new task
- **AND** returns 201 Created with the created task including `"tags": [{"name": "NewCategory"}]`

### Requirement: Read Task
The system SHALL allow users to retrieve a single task by ID. The response includes additional fields: `status` (string) and `tags` (array of objects).

#### Scenario: Successful Task Retrieval
- **WHEN** user sends GET request to /v1/tasks/{id}
- **THEN** system returns 200 OK with the task data

#### Scenario: Successful Task Retrieval with New Fields
- **WHEN** user sends GET request to /v1/tasks/{id}
- **THEN** system returns 200 OK with the task data including `"status"` field and `"tags"` array

### Requirement: List All Tasks
The system SHALL allow users to retrieve all tasks. The endpoint now supports an optional `status` query parameter for filtering results. When no filter is specified, behavior remains unchanged (returns all tasks).

#### Scenario: Successful Task Listing
- **WHEN** user sends GET request to /v1/tasks
- **THEN** system returns 200 OK with array of all tasks (all statuses)

#### Scenario: Filtered Task Listing by Status
- **WHEN** user sends GET request to /v1/tasks?status=PENDING
- **THEN** system returns 200 OK with an array containing only tasks matching the `PENDING` status filter

### Requirement: Update Task
The system SHALL allow users to update an existing task. The endpoint now accepts optional fields for `status` (leaves unchanged if omitted) and `tagNames[]` (replaces all tags on the task when provided; removes all tags if set to empty array).

#### Scenario: Successful Task Update
- **WHEN** user sends PUT request to /v1/tasks/{id} with valid task data
- **THEN** system returns 200 OK with the updated task

#### Scenario: Successful Task Update with Status Change
- **WHEN** user sends PUT request to /v1/tasks/{id} with `"status": "COMPLETED"` in the body alongside other fields
- **THEN** system updates the task and returns 200 OK with the updated task reflecting the new status value

#### Scenario: Successful Task Update Replacing Tags
- **WHEN** user sends PUT request to /v1/tasks/{id} with `"tagNames": ["Work", "Urgent"]` in the body where a previous tag was assigned
- **THEN** system removes all previous tags from the task and assigns only `Work` and `Urgent`
- **AND** returns 200 OK with updated tags

#### Scenario: Successful Task Update Without Status Changes
- **WHEN** user sends PUT request to /v1/tasks/{id} without including a `status` field in the body
- **THEN** system leaves the task's current status unchanged
- **AND** returns 200 OK with the updated task

### Requirement: Delete Task
The system SHALL allow users to delete a task.

#### Scenario: Successful Task Deletion
- **WHEN** user sends DELETE request to /v1/tasks/{id}
- **THEN** system returns 204 No Content

### Requirement: Task Priority Levels
The system SHALL support three priority levels: LOW, MEDIUM, HIGH.

#### Scenario: Task with High Priority
- **WHEN** user creates task with priority HIGH
- **THEN** system stores and returns priority as HIGH

### Requirement: Task Due Date
The system SHALL allow tasks to have an optional due date in date-only format (`yyyy-MM-dd`).

**ID**: REQ-TM-007
**Affected files**: 
- `com.example.todo.dto.TaskRequest.java` — `dueDate` field is `@JsonFormat(pattern="yyyy-MM-dd") LocalDate`
- `com.example.todo.model.Task.java` — `dueDate` column is `date` type in PostgreSQL
- `frontend/src/components/AddTaskModal.tsx` — `<input type="date">` produces `yyyy-MM-dd`

#### Scenario: Successful Task Creation with Due Date
- **WHEN** user creates task with dueDate 2024-12-31
- **THEN** system stores and returns the exact same date
