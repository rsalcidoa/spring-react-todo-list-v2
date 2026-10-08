# Spec Delta

## ADDED Requirements

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
