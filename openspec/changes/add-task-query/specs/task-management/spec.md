# Spec Delta

## MODIFIED Requirements

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
