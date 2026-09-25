# user-authentication Specification

## Purpose
Provides basic user authentication and authorization for task ownership.

## Requirements

### Requirement: User Registration with Auto-login
The system SHALL allow new users to register with email and password, then automatically log them in after successful registration and redirect to /tasks. Upon registration failure the frontend shall display an appropriate error message. The system SHALL return HTTP 409 Conflict with a structured error body when a duplicate email is detected.

**ID**: REQ-UA-001
**Affected files**: 
- `com.example.todo.service.UserService.register()` — throws `UserAlreadyExistsException` on duplicate email (pre-check + race protection)
- `com.example.todo.exception.UserAlreadyExistsException` — new exception class
- `com.example.todo.exception.GlobalExceptionHandler` — maps `UserAlreadyExistsException` to 409
- `frontend/src/pages/RegisterPage.tsx` — displays error message from 409 response body (completed in `unify-frontend-http-client`)

#### Scenario: Successful User Registration with Auto-login
- **WHEN** unregistered user sends POST request to /v1/auth/register with valid unique email and 6+ char password
- **THEN** system returns 201 Created with redacted user data (email only)
- **AND** frontend automatically calls POST /v1/auth/login with the same credentials after receiving 201 response
- **AND** frontend stores JWT token from login response in localStorage as 'jwt' and email as 'email'
- **AND** frontend navigates to /tasks route

#### Scenario: Registration With Duplicate Email Fails Gracefully
- **WHEN** user sends POST request to /v1/auth/register with an email that already exists in the database
- **THEN** system returns 409 Conflict with JSON body `{"error": "Este email ya está registrado"}`
- **AND** frontend displays the error message from the response body

### Requirement: User Login
The system SHALL allow registered users to login and receive a JWT token, enforcing input validation on both email format and password length. Empty or malformed inputs shall be rejected with 400 Bad Request before authentication processing.

**Affected files**: 
- `com.example.todo.dto.LoginRequest.java` — add `@NotBlank(message = "Email must not be blank") @Email(message = "Invalid email format")` to email field; add `@NotBlank(message = "Password must not be blank")` to password field
- `com.example.todo.controller.AuthController.login()` — accept request body annotated with `@Valid`

#### Scenario: Successful User Login
- **WHEN** user sends POST request to /v1/auth/login with valid credentials
- **THEN** system returns 200 OK with JWT token

#### Scenario: Login Rejects Empty Email Field
- **WHEN** user sends POST request to /v1/auth/login with empty or missing email
- **THEN** Bean Validation fails on `@NotBlank` constraint for email field and system returns 400 Bad Request

#### Scenario: Login Rejects Short Password
- **WHEN** user sends POST request to /v1/auth/login with password shorter than 6 characters
- **THEN** Bean Validation fails or backend validates before BCrypt comparison, system returns 400 Bad Request

### Requirement: Task Ownership
**ID**: REQ-TO-001
The system SHALL associate tasks with the user who created them. The authenticated user SHALL be resolved inside the service layer through the current-user seam; controllers SHALL NOT resolve the user themselves.

**Affected files**: `com.example.todo.security.CurrentUserProvider` — nuevo; `com.example.todo.service.TaskService` — resuelve al usuario interno; `com.example.todo.controller.TaskController` — elimina `getCurrentUser()`.

#### Scenario: User Creates Task
- **WHEN** authenticated user creates a task via POST /v1/tasks
- **THEN** system assigns the task to that user's ID extracted from JWT token

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
