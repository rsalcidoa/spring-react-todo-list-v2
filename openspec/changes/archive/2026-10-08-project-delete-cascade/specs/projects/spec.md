# Spec Delta

## REMOVED Requirements

### Requirement: Delete User Project

## ADDED Requirements

### Requirement: Delete User Project and Its Tasks
The system SHALL delete an owned project via `DELETE /v1/projects/{id}` together with every task that belongs to it, including their subtasks. Deleting another user's project returns 403; a missing id returns 404.

**ID**: REQ-PRJ-005
**Affected files**:
- `com.example.todo.service.ProjectService.delete(Long)`
- `com.example.todo.repository.TaskRepository`

#### Scenario: Delete removes the project and its tasks
- **WHEN** the user deletes a project that has tasks
- **THEN** the project is removed and its tasks (and their subtasks) no longer exist

#### Scenario: Unrelated tasks remain
- **WHEN** the user deletes one project
- **THEN** tasks that do not belong to it are unchanged
