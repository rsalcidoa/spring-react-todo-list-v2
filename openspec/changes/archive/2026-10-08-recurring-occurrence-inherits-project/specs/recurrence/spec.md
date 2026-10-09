# Spec Delta

## ADDED Requirements

### Requirement: Next Occurrence Field Inheritance
When a Task with a non-`NONE` recurrence transitions to `COMPLETED`, the next
occurrence SHALL be a new `PENDING` Task that inherits the completed Task's
`title`, `description`, `priority`, `tags`, `recurrence` rule and `project` (when
set), with its `dueDate` advanced by the rule and its `reminderAt` (when set)
shifted by the same day delta. It SHALL NOT inherit a `parent`: a Subtask SHALL
NOT carry a non-`NONE` recurrence, and such a request SHALL be rejected with 400
Bad Request naming the `recurrence` field.

**ID**: REQ-REC-002
**Affected files**:
- `backend/src/main/java/com/example/todo/service/TaskService.java` — `generateNextOccurrence` copies the project; `validateRecurrence` rejects a Subtask recurrence

#### Scenario: The next occurrence inherits the Project
- **WHEN** a recurring Task that belongs to a Project is completed
- **THEN** the new occurrence carries the same `projectId` as the completed Task

#### Scenario: A recurring Task without a Project stays project-less
- **WHEN** a recurring Task with no Project is completed
- **THEN** the new occurrence has a null `projectId`

#### Scenario: A Subtask cannot recur
- **WHEN** the user creates or updates a Task with a `parentId` and a non-`NONE` `recurrence`
- **THEN** the request is rejected with 400 Bad Request with `errors.recurrence`
