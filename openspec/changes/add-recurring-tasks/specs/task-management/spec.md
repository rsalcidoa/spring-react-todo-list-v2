# Spec Delta

## ADDED Requirements

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
