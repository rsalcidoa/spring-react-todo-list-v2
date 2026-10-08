# user-authentication Specification

## Purpose
Provides basic user authentication and authorization for task ownership.

## Requirements

### Requirement: User Registration with Auto-login
The system SHALL allow new users to register with email and password, then automatically log them in after successful registration and redirect to /tasks. Registration SHALL return 201 Created with its own response DTO (`RegisterResponse` carrying the redacted user data — email only), never reusing the request DTO. Upon registration failure the frontend shall display an appropriate error message. The system SHALL return HTTP 409 Conflict with a structured error body when a duplicate email is detected.

**ID**: REQ-UA-001
**Affected files**: 
- `com.example.todo.controller.AuthController.register()` — returns `RegisterResponse`, thin delegate
- `com.example.todo.service.UserService.register()` — throws `UserAlreadyExistsException` on duplicate email (pre-check + race protection)
- `com.example.todo.exception.UserAlreadyExistsException` — exception class
- `com.example.todo.exception.GlobalExceptionHandler` — maps `UserAlreadyExistsException` to 409
- `frontend/src/pages/RegisterPage.tsx` — calls `api.post('/auth/register', …)` directly (no `AuthService` indirection); displays error message from 409 response body

#### Scenario: Successful User Registration with Auto-login
- **WHEN** unregistered user sends POST request to /v1/auth/register with valid unique email and 6+ char password
- **THEN** system returns 201 Created with redacted user data (email only)
- **AND** frontend automatically calls POST /v1/auth/login with the same credentials after receiving 201 response
- **AND** frontend stores JWT token from login response in localStorage as 'jwt' and email as 'email'
- **AND** frontend navigates to /tasks route

#### Scenario: Registration With Duplicate Email Fails Gracefully
- **WHEN** user sends POST request to /v1/auth/register with an email that already exists in the database
- **THEN** system returns 409 Conflict with JSON body `{"error": "Este email ya está registrado"}` (intentionally Spanish for the UI)
- **AND** frontend displays the error message from the response body

### Requirement: User Login
The system SHALL allow registered users to login and receive a JWT token. Login validates that email is non-blank with valid format and password is non-blank. Login does NOT enforce the registration minimum password length: a short but non-blank password proceeds to authentication. Wrong credentials SHALL return 401 Unauthorized with body `{"error": "Invalid email or password"}` (mapped from Spring Security's `AuthenticationException`, never a framework default).

**Affected files**: 
- `com.example.todo.dto.LoginRequest.java` — `@NotBlank(message = "Email must not be blank") @Email(message = "Must be a valid email address")` on email; `@NotBlank(message = "Password must not be blank")` on password (no `@Size`)
- `com.example.todo.controller.AuthController.login()` — accept request body annotated with `@Valid`
- `com.example.todo.exception.GlobalExceptionHandler` — maps `AuthenticationException` to the 401 contract message

#### Scenario: Successful User Login
- **WHEN** user sends POST request to /v1/auth/login with valid credentials
- **THEN** system returns 200 OK with JWT token

#### Scenario: Login Rejects Empty Email Field
- **WHEN** user sends POST request to /v1/auth/login with empty or missing email
- **THEN** Bean Validation fails on `@NotBlank` constraint for email field and system returns 400 Bad Request

#### Scenario: Login With Short Password Goes To Authentication
- **WHEN** user sends POST request to /v1/auth/login with a short but non-blank password
- **THEN** Bean Validation passes (no length rule on login)
- **AND** authentication fails with 401 Unauthorized when credentials are wrong

#### Scenario: Login With Wrong Credentials Returns Contract 401
- **WHEN** user sends POST request to /v1/auth/login with a well-formed but incorrect email/password
- **THEN** system returns 401 Unauthorized with body `{"error": "Invalid email or password"}`

### Requirement: Task Ownership
**ID**: REQ-TO-001
The system SHALL associate tasks with the user who created them. The authenticated user SHALL be resolved inside the service layer through the current-user seam; controllers SHALL NOT resolve the user themselves. The forbidden-decision (owner mismatch → 403) SHALL live in `CurrentUserProvider.requireOwned` and be shared by the task and tag modules; resource lookup (`findById` → 404) stays in the owning module.

**Affected files**: `com.example.todo.security.CurrentUserProvider` — nuevo; `com.example.todo.service.TaskService` — resuelve al usuario interno; `com.example.todo.controller.TaskController` — elimina `getCurrentUser()`.

#### Scenario: User Creates Task
- **WHEN** authenticated user creates a task via POST /v1/tasks
- **THEN** system assigns the task to that user's ID extracted from JWT token

### Requirement: Task Access Control
**ID**: REQ-UAC-001
The system SHALL only allow users to view, update, or delete their own tasks. A request by an authenticated user for an existing task that belongs to another user SHALL return 403 Forbidden via the shared ownership decision (`CurrentUserProvider.requireOwned`). A request for a task id that does not exist SHALL return 404 Not Found. The 403/404 distinction applies to GET /v1/tasks/{id}, PUT /v1/tasks/{id}, DELETE /v1/tasks/{id} and PATCH /v1/tasks/{id}/status. A request without a valid authenticated user SHALL return 401 Unauthorized with body `{"error": "Authentication required"}` (same body from the handler and from the security entry point).

**Affected files**:
- `com.example.todo.security.CurrentUserProvider` — resuelve el usuario autenticado una vez por request
- `com.example.todo.service.TaskService` — las operaciones propias (get/update/delete/patch status) deciden found / not-found / forbidden
- `com.example.todo.exception.GlobalExceptionHandler` — mapea ownership 403, not-found 404, unauthenticated 401 con body
- `com.example.todo.config.SecurityConfig` — entryPoint 401 con el mismo body

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

#### Scenario: Request without authentication returns 401 with body
- **WHEN** user sends any authenticated request without a valid token
- **THEN** system returns 401 Unauthorized with body `{"error": "Authentication required"}`

### Requirement: Password Reset Flow (reference)
Password recovery SHALL behave as specified canonically in `password-reset` (REQ-PR-001..005). Verification (`POST /v1/auth/reset-verify`) is read-only and returns `{"verified": true}`; the token is invalidated only by `PUT /v1/auth/reset-change`.

**ID**: REQ-UA-002

#### Scenario: Canonical reset flow applies
- **WHEN** a user performs password recovery
- **THEN** the system behaves per `password-reset` REQ-PR-001..005

### Requirement: Refresh Token Issuance
On successful login the system SHALL return both an access token and a refresh token in the response body. The refresh token SHALL be an opaque random value whose SHA-256 hash is stored server-side with an expiry, associated with the user. The raw refresh token SHALL never be stored. The access token's lifetime SHALL remain short (about 1 hour).

**ID**: REQ-UA-003
**Affected files**:
- `com.example.todo.controller.AuthController.login()` — returns `{ token, refreshToken }`
- `com.example.todo.model.RefreshToken` — `tokenHash`, `userId`, `expiresAt`, `revokedAt`
- `com.example.todo.repository.RefreshTokenRepository`
- `backend/src/main/resources/db/migration/V11__add_refresh_tokens.sql`

#### Scenario: Login issues both tokens
- **WHEN** a user logs in with valid credentials
- **THEN** system returns 200 OK with a non-empty `token` and `refreshToken`

#### Scenario: Refresh token is stored hashed
- **WHEN** a refresh token is issued
- **THEN** only its hash is persisted; the raw value appears only in the response

### Requirement: Access Token Refresh
`POST /v1/auth/refresh` SHALL accept a refresh token and, if it is well-formed, unexpired and not revoked, return a new access token **and rotate** the refresh token (revoke the used one and issue a new one). An invalid, expired or revoked token SHALL return 401 Unauthorized with the structured `{error}` body. Presenting an already-revoked token (reuse) SHALL revoke all of that user's active refresh tokens.

**ID**: REQ-UA-004
**Affected files**:
- `com.example.todo.controller.AuthController.refresh()` — thin delegate
- `com.example.todo.service.TokenService.refresh(rawToken)` — validation, rotation and reuse detection
- `com.example.todo.dto.RefreshRequest` / `TokenPairResponse`

#### Scenario: Successful refresh rotates the token
- **WHEN** the client presents a valid refresh token
- **THEN** system returns 200 with a new `token` and a new `refreshToken`, and the previous refresh token is revoked

#### Scenario: Invalid or expired token rejected
- **WHEN** the client presents an unknown, expired or revoked refresh token
- **THEN** system returns 401 Unauthorized with `{"error": "Invalid refresh token"}`

#### Scenario: Reuse detection revokes the family
- **WHEN** a previously rotated (revoked) refresh token is presented
- **THEN** system returns 401 and revokes all active refresh tokens for that user
