# Spec Delta

## ADDED Requirements

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
