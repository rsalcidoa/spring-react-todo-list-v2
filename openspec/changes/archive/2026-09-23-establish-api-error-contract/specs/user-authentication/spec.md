# Spec Delta — user-authentication

## MODIFIED Requirements

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
