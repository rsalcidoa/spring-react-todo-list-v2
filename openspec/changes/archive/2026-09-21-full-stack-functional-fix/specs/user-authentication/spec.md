# Spec Delta — user-authentication

## MODIFIED Requirements

### Requirement: User Registration with Auto-login (MODIFIES "User Registration")
The system SHALL allow new users to register with email and password, then automatically log them in after successful registration and redirect to /tasks. Upon registration failure the frontend shall display an appropriate error message.

**Affected files**: 
- `com.example.todo.controller.AuthController.register()` — existing endpoint behavior unchanged
- `frontend/src/pages/RegisterPage.tsx` — call `registerUser(email, password)` from AuthService; on success auto-login then navigate to /tasks

#### Scenario: Successful User Registration with Auto-login (MODIFIES original)
- **WHEN** unregistered user sends POST request to /v1/auth/register with valid unique email and 6+ char password
- **THEN** system returns 201 Created with redacted user data (email only)
- **AND** frontend automatically calls POST /v1/auth/login with the same credentials after receiving 201 response
- **AND** frontend stores JWT token from login response in localStorage as 'jwt' and email as 'email'
- **AND** frontend navigates to /tasks route

#### Scenario: Registration With Duplicate Email Fails Gracefully (NEW)
- **WHEN** user sends POST request to /v1/auth/register with an email that already exists in the database
- **THEN** system returns 409 Conflict or 422 Unprocessable Entity (Spring Data Integrity violation)
- **AND** frontend displays error message "Este email ya está registrado"

### Requirement: User Login (MODIFIES original)
The system SHALL allow registered users to login and receive a JWT token, enforcing input validation on both email format and password length. Empty or malformed inputs shall be rejected with 400 Bad Request before authentication processing.

**Affected files**: 
- `com.example.todo.dto.LoginRequest.java` — add `@NotBlank(message = "Email must not be blank") @Email(message = "Invalid email format")` to email field; add `@NotBlank(message = "Password must not be blank")` to password field
- `com.example.todo.controller.AuthController.login()` — accept request body annotated with `@Valid`

#### Scenario: Successful User Login (PRESERVED from original)
- **WHEN** user sends POST request to /v1/auth/login with valid credentials
- **THEN** system returns 200 OK with JWT token

#### Scenario: Login Rejects Empty Email Field (NEW)
- **WHEN** user sends POST request to /v1/auth/login with empty or missing email
- **THEN** Bean Validation fails on `@NotBlank` constraint for email field and system returns 400 Bad Request

#### Scenario: Login Rejects Short Password (NEW)
- **WHEN** user sends POST request to /v1/auth/login with password shorter than 6 characters
- **THEN** Bean Validation fails or backend validates before BCrypt comparison, system returns 400 Bad Request

### Requirement: Task Ownership (PRESERVED — no behavioral change)
The system SHALL associate tasks with the user who created them. No changes to existing behavior.

**Affected files**: `com.example.todo.service.TaskService` — unchanged, already extracts user_id from JWT via SecurityContext.

#### Scenario: User Creates Task (PRESERVED)
- **WHEN** authenticated user creates a task via POST /v1/tasks
- **THEN** system assigns the task to that user's ID extracted from JWT token

### Requirement: Task Access Control (PRESERVED — no behavioral change)
The system SHALL only allow users to view, update, or delete their own tasks. No changes to existing behavior.

**Affected files**: `com.example.todo.service.TaskService` and `TaskRepository.findByUserAndId()` — unchanged.

#### Scenario: User Tries to Access Another User's Task (PRESERVED)
- **WHEN** user sends GET request to /v1/tasks/{id} belonging to another user
- **THEN** system returns 403 Forbidden
