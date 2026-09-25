# Spec Delta — user-authentication (edges honestos)

## MODIFIED Requirements

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
