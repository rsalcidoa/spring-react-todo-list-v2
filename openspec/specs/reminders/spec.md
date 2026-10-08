# reminders Specification

## Purpose
Delivers task reminders in-app: a task can carry a `reminderAt`, and due reminders are surfaced to the user (browser notification + indicator) without an email or push service.

## Requirements

### Requirement: List Due Reminders
The system SHALL return the authenticated user's reminders that are due and not yet notified via `GET /v1/tasks/reminders`: tasks whose `reminderAt` is non-null, `<= now`, and whose `reminderNotifiedAt` is null. The response SHALL be a list of task objects (same shape as `TaskResponse`) scoped to the user.

**ID**: REQ-REM-001
**Affected files**:
- `com.example.todo.controller.TaskController.getDueReminders()` — thin delegate
- `com.example.todo.service.ReminderService.dueReminders()` — computes due set via the repository
- `com.example.todo.repository.TaskRepository` — query by `reminderAt <= now and reminderNotifiedAt is null` and user

#### Scenario: Due reminders are returned
- **WHEN** an authenticated user has a task with `reminderAt` in the past and `reminderNotifiedAt` null, and calls `GET /v1/tasks/reminders`
- **THEN** system returns 200 OK with that task

#### Scenario: Not-yet-due and already-notified are excluded
- **WHEN** the user has tasks whose `reminderAt` is in the future or whose `reminderNotifiedAt` is set
- **THEN** those tasks are not included in the response

### Requirement: Acknowledge Reminder
The system SHALL mark a task's reminder as notified via `POST /v1/tasks/{id}/reminder-ack`, setting `reminderNotifiedAt` to the current time. The operation SHALL be idempotent: acknowledging an already-notified reminder SHALL return 200 OK without change. A task that does not exist returns 404; a task owned by another user returns 403 (shared ownership seam).

**ID**: REQ-REM-002
**Affected files**:
- `com.example.todo.controller.TaskController.ackReminder()` — thin delegate
- `com.example.todo.service.ReminderService.acknowledge(Long id)` — found/forbidden decision via `CurrentUserProvider.requireOwned`

#### Scenario: Acknowledge a due reminder
- **WHEN** the user calls `POST /v1/tasks/{id}/reminder-ack` for their task
- **THEN** system returns 200 OK and `reminderNotifiedAt` is set

#### Scenario: Acknowledge is idempotent
- **WHEN** the same reminder is acknowledged twice
- **THEN** both calls return 200 OK and the value does not move backwards

#### Scenario: Acknowledge respects ownership
- **WHEN** the user acknowledges a task owned by another user
- **THEN** system returns 403 Forbidden; a non-existent id returns 404
