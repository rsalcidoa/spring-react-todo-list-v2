# Spec Delta

## ADDED Requirements

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
