# Spec Delta

## ADDED Requirements

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
