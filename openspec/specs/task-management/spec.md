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
The system SHALL allow users to retrieve their tasks with optional, composable filters, always scoped to the authenticated user. It SHALL accept:
- `status` — `PENDING|ACTIVE|COMPLETED`
- `q` — case-insensitive substring match over `title` and `description`
- `priority` — `LOW|MEDIUM|HIGH`
- `tagIds` — one or more tag ids; a task matches if it carries ANY of them
- `sort` — one of `createdAt`, `dueDate`, `priority`, `title` (default `createdAt`)
- `dir` — `asc` or `desc` (default `desc` when `sort=createdAt`, otherwise `asc`)

When no parameters are provided, behavior is unchanged (all tasks, no filtering). Invalid `status`, `priority`, `sort` or `dir` values SHALL be rejected with 400 Bad Request carrying the structured `{"error":"Validation failed","errors":{...}}` body (the same contract the status operation produces), never a generic conversion error.

**ID**: REQ-TM-008
**Affected files**:
- `com.example.todo.controller.TaskController.getAllTasks()` — accepts the raw parameters and delegates; no parsing in the controller
- `com.example.todo.service.TaskService` — owns parsing/validation through a single `TaskQuery` operation and delegates filtering to the repository
- `com.example.todo.repository.TaskRepository` — query method backing search/filter/sort

#### Scenario: Successful Task Listing
- **WHEN** user sends GET request to /v1/tasks
- **THEN** system returns 200 OK with array of all the user's tasks (all statuses), unchanged from today

#### Scenario: Filtered Task Listing by Status
- **WHEN** user sends GET request to /v1/tasks?status=PENDING
- **THEN** system returns 200 OK with an array containing only tasks matching the `PENDING` status filter

#### Scenario: Invalid Status Filter Rejected
- **WHEN** user sends GET request to /v1/tasks?status=INVALID
- **THEN** system returns 400 Bad Request with `{"error":"Validation failed","errors":{"status":["Status must be PENDING, ACTIVE or COMPLETED"]}}`

#### Scenario: Search by text
- **WHEN** user sends GET /v1/tasks?q=informe
- **THEN** system returns 200 OK with only tasks whose title or description contains "informe" case-insensitively

#### Scenario: Filter by priority and tags
- **WHEN** user sends GET /v1/tasks?priority=HIGH&tagIds=3&tagIds=5
- **THEN** system returns 200 OK with only HIGH-priority tasks carrying tag 3 or tag 5

#### Scenario: Sort by due date ascending
- **WHEN** user sends GET /v1/tasks?sort=dueDate&dir=asc
- **THEN** system returns tasks ordered by dueDate ascending, with tasks that have no due date placed last

#### Scenario: Invalid sort field rejected
- **WHEN** user sends GET /v1/tasks?sort=bogus
- **THEN** system returns 400 Bad Request with `{"error":"Validation failed","errors":{"sort":[...]}}` and no task data

#### Scenario: Invalid priority filter rejected
- **WHEN** user sends GET /v1/tasks?priority=URGENT
- **THEN** system returns 400 Bad Request with the structured body naming the `priority` field

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

### Requirement: Task Reminder Field
A task SHALL accept an optional `reminderAt` timestamp on create and update and SHALL echo it in every task response. Sending `reminderAt: null` clears the reminder. A malformed timestamp SHALL be rejected with 400 Bad Request using the structured `{error, errors}` contract (field `reminderAt`).

**ID**: REQ-REM-003
**Affected files**:
- `com.example.todo.dto.TaskRequest` — optional `reminderAt` (ISO-8601 timestamp)
- `com.example.todo.dto.TaskResponse` — echoes `reminderAt`
- `com.example.todo.model.Task` — `reminderAt` (timestamp), `reminderNotifiedAt` (timestamp)
- `backend/src/main/resources/db/migration/V5__add_task_reminders.sql` — add the two columns

#### Scenario: Create a task with a reminder
- **WHEN** the user creates a task with `reminderAt` in the future
- **THEN** system returns 201 Created echoing the same `reminderAt`

#### Scenario: Clear a reminder
- **WHEN** the user updates a task with `reminderAt: null`
- **THEN** the reminder is cleared and the response echoes `reminderAt: null`

#### Scenario: Malformed reminder rejected
- **WHEN** the user sends a malformed `reminderAt`
- **THEN** system returns 400 Bad Request with `errors.reminderAt`

### Requirement: Task Recurrence Field
A task SHALL accept an optional `recurrence` of `NONE` (default), `DAILY`, `WEEKLY` or `MONTHLY`, and SHALL echo it in every task response. Setting a non-`NONE` recurrence without a `dueDate` SHALL be rejected with 400 Bad Request naming the `recurrence` field. Sending `recurrence: NONE` clears it.

**ID**: REQ-REC-003
**Affected files**:
- `com.example.todo.dto.TaskRequest` — optional `recurrence`
- `com.example.todo.dto.TaskResponse` — echoes `recurrence`
- `com.example.todo.model.Task` — `recurrence` column
- `backend/src/main/resources/db/migration/V6__add_task_recurrence.sql`

#### Scenario: Create a recurring task
- **WHEN** the user creates a task with `recurrence: WEEKLY` and a due date
- **THEN** system returns 201 Created echoing `recurrence: WEEKLY`

#### Scenario: Recurrence without due date rejected
- **WHEN** the user creates or updates a task with `recurrence: DAILY` and no due date
- **THEN** system returns 400 Bad Request with `errors.recurrence`

### Requirement: Task Project Assignment
A task SHALL accept an optional `projectId` on create and update and SHALL echo the assigned project (or `null`) in every task response. The project MUST belong to the authenticated user, verified through the shared ownership seam; an unknown or foreign `projectId` SHALL be rejected with 400 Bad Request naming the `projectId` field. Sending `projectId: null` clears the assignment. Deleting a project clears it from its tasks.

**ID**: REQ-TM-009
**Affected files**:
- `com.example.todo.dto.TaskRequest` — optional `projectId`
- `com.example.todo.dto.TaskResponse` — `projectId` (and/or a small project reference)
- `com.example.todo.service.TaskService` — resolves/validates the project through the project module
- `com.example.todo.model.Task` — `project` (nullable FK)
- `backend/src/main/resources/db/migration/V7__add_projects.sql` — `tasks.project_id` column

#### Scenario: Create a task in a project
- **WHEN** the user creates a task with `projectId` of one of their projects
- **THEN** system returns 201 Created and the task response carries the project

#### Scenario: Foreign or unknown project rejected
- **WHEN** the user sends a `projectId` that does not belong to them
- **THEN** system returns 400 Bad Request with `errors.projectId`

#### Scenario: Clear the project
- **WHEN** the user updates a task with `projectId: null`
- **THEN** the assignment is cleared and echoed as `null`

### Requirement: Task Subtask Assignment
A task DTO SHALL expose the optional `parentId` and a `subtaskProgress` summary, and the create/update flow SHALL accept `parentId` for top-level parents only. The full assignment and one-level rules are specified canonically in the `subtasks` capability (REQ-SUB-001..003); this requirement only pins the task DTO surface.

**ID**: REQ-TM-010
**Affected files**:
- `com.example.todo.dto.TaskRequest` — optional `parentId`
- `com.example.todo.dto.TaskResponse` — `parentId` and `subtaskProgress`

#### Scenario: Task response carries parent and progress
- **WHEN** a task with subtasks is returned by any endpoint
- **THEN** the response includes `subtaskProgress` with `done` and `total`

#### Scenario: parentId accepted on create
- **WHEN** the user creates a task with a valid `parentId`
- **THEN** system returns 201 Created with the subtask

### Requirement: Paginated Task Listing
When `page` and `size` query parameters are present, `GET /v1/tasks` SHALL return a page envelope `{"items": TaskResponse[], "page": number, "size": number, "total": number}`; the filters and sort from the listing requirement SHALL apply before pagination. `page` SHALL be `>= 0` and `size` SHALL be between 1 and 100; invalid values SHALL be rejected with 400 Bad Request carrying the structured `{error, errors}` body. When the parameters are absent, the response SHALL remain the plain array (unchanged).

**ID**: REQ-TM-011
**Affected files**:
- `com.example.todo.controller.TaskController.getAllTasks()` — optional `page`/`size`
- `com.example.todo.service.TaskService` — builds a `Pageable` and returns a page
- `com.example.todo.dto.PageResponse` — envelope record

#### Scenario: Paginated response envelope
- **WHEN** the user sends `GET /v1/tasks?page=0&size=20`
- **THEN** system returns 200 with `items` (at most 20), `page`, `size` and the total count

#### Scenario: No params keeps the array
- **WHEN** the user sends `GET /v1/tasks` without pagination params
- **THEN** system returns the plain array, unchanged

#### Scenario: Invalid pagination rejected
- **WHEN** the user sends `size=0`, `size=1000` or `page=-1`
- **THEN** system returns 400 Bad Request with `errors.page` or `errors.size`

### Requirement: Task Completion Timestamp
A task SHALL expose a nullable `completedAt` timestamp. It SHALL be set to the
moment the task transitions to `COMPLETED` and SHALL be cleared (null) when the
task leaves `COMPLETED` for `PENDING` or `ACTIVE`. The transition SHALL be
recognized on every write path that changes the Status — create, update, the
status change and the manual ordering (position/reorder). A task that is created
already `COMPLETED` SHALL have a completion timestamp; a task that has never been
completed SHALL have a null one. The value SHALL be echoed in every task response
(create, update, status change, ordering and listing).

**ID**: REQ-TM-012
**Affected files**:
- `com.example.todo.model.Task` — `completedAt` column
- `com.example.todo.service.TaskAccess` — owns the completion-timestamp rule
- `com.example.todo.service.TaskService` / `TaskOrderingService` — apply it on status changes
- `com.example.todo.dto.TaskResponse` — echoes `completedAt`
- `backend/src/main/resources/db/migration/V13__add_task_completed_at.sql`

#### Scenario: Completing a task records the timestamp
- **WHEN** a Pending or Active task transitions to `COMPLETED`
- **THEN** the response carries a non-null `completedAt`

#### Scenario: Completing by reordering records the timestamp
- **WHEN** a task is moved to the Completed column through the position/reorder endpoint
- **THEN** its `completedAt` is set

#### Scenario: Reopening clears the timestamp
- **WHEN** a Completed task is set back to `PENDING` or `ACTIVE` (including by reordering out of the Completed column)
- **THEN** its `completedAt` becomes null

#### Scenario: An untouched task has no timestamp
- **WHEN** a task has never been completed
- **THEN** its `completedAt` is null

#### Scenario: Re-saving a completed task keeps the timestamp
- **WHEN** a Completed task is updated without changing its status
- **THEN** its `completedAt` is unchanged
