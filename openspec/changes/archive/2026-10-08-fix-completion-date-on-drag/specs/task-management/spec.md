# Spec Delta

## MODIFIED Requirements

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
