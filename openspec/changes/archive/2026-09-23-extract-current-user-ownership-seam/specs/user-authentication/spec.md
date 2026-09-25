# Spec Delta — user-authentication

## MODIFIED Requirements

### Requirement: Task Access Control
**ID**: REQ-UAC-001
The system SHALL only allow users to view, update, or delete their own tasks. A request by an authenticated user for an existing task that belongs to another user SHALL return 403 Forbidden. A request for a task id that does not exist SHALL return 404 Not Found. The 403/404 distinction applies to GET /v1/tasks/{id}, PUT /v1/tasks/{id}, DELETE /v1/tasks/{id} and PATCH /v1/tasks/{id}/status. A request without a valid authenticated user SHALL return 401 Unauthorized.

**Affected files**:
- `com.example.todo.security.CurrentUserProvider` — nuevo; resuelve el usuario autenticado una vez por request
- `com.example.todo.service.TaskService` — las operaciones propias (get/update/delete/patch status) deciden found / not-found / forbidden
- `com.example.todo.exception.GlobalExceptionHandler` — mapea ownership 403, not-found 404, unauthenticated 401

#### Scenario: User Tries to Access Another User's Task
- **WHEN** user sends GET request to /v1/tasks/{id} belonging to another user
- **THEN** system returns 403 Forbidden

#### Scenario: Cross-user update of a task is forbidden
- **WHEN** user sends PUT /v1/tasks/{id} for a task that belongs to another user
- **THEN** system returns 403 Forbidden and the task is not modified

#### Scenario: Cross-user delete of a task is forbidden
- **WHEN** user sends DELETE /v1/tasks/{id} for a task that belongs to another user
- **THEN** system returns 403 Forbidden and the task is not deleted

#### Scenario: Cross-user status patch of a task is forbidden
- **WHEN** user sends PATCH /v1/tasks/{id}/status for a task that belongs to another user
- **THEN** system returns 403 Forbidden and the status is not changed

#### Scenario: Request for a non-existent task returns 404
- **WHEN** user sends GET, PUT, DELETE or PATCH /v1/tasks/{id}/status for an id that does not exist
- **THEN** system returns 404 Not Found

### Requirement: Task Ownership
**ID**: REQ-TO-001
The system SHALL associate tasks with the user who created them. The authenticated user SHALL be resolved inside the service layer through the current-user seam; controllers SHALL NOT resolve the user themselves.

**Affected files**: `com.example.todo.security.CurrentUserProvider` — nuevo; `com.example.todo.service.TaskService` — resuelve al usuario interno; `com.example.todo.controller.TaskController` — elimina `getCurrentUser()`.

#### Scenario: User Creates Task
- **WHEN** authenticated user creates a task via POST /v1/tasks
- **THEN** system assigns the task to that user's ID extracted from JWT token
