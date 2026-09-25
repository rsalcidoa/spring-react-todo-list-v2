# Spec Delta

## ADDED Requirements

### Requirement: Password Reset Flow
The system SHALL provide a complete password recovery mechanism for users who forget their password. Since no email service is available, the reset token SHALL be generated server-side and displayed to the user in the response body. The user SHALL manually enter the token on the reset page.

**Affected files**:
- `com.example.todo.controller.AuthController` — endpoints `POST /v1/auth/reset-request`, `POST /v1/auth/reset-verify`, `PUT /v1/auth/reset-change`
- `com.example.todo.service.UserService` — methods `requestReset()`, `verifyResetToken()`, `changePasswordViaReset()`
- `com.example.todo.model.User` — fields `resetToken` (VARCHAR), `resetExpires` (TIMESTAMP)
- `com.example.todo.dto` — `ResetRequestDto`, `ResetVerifyDto`, `PasswordChangeDto`
- `com.example.todo.exception` — `InvalidResetTokenException`, `ResetTokenExpiredException`
- `com.example.todo.repository.UserRepository` — method `findByResetToken(String token)`
- `db/migration/V3__add_password_reset.sql` — ADD reset_token VARCHAR(255), reset_expires TIMESTAMP

**Frontend**:
- `frontend/src/pages/ForgotPasswordPage.tsx` — route `/forgot-password`
- `frontend/src/pages/ResetPasswordPage.tsx` — route `/reset/:token`
- `frontend/src/services/ApiService.ts` — endpoints `requestReset`, `verifyResetToken`, `changePasswordReset`
- `frontend/src/App.tsx` — new routes

#### Scenario: User requests password reset with valid email
- **WHEN** user sends POST `/v1/auth/reset-request` with a valid registered email
- **THEN** system generates a 6-character alphanumeric token
- **AND** stores it with a 1-hour expiration
- **AND** returns 200 OK with body `{"token": "ABC123"}`

#### Scenario: User requests reset with non-existent email (silent failure)
- **WHEN** user sends POST `/v1/auth/reset-request` with an unregistered email
- **THEN** system returns 200 OK with empty token `{"token": ""}` (no information disclosure)

#### Scenario: User verifies a valid reset token
- **WHEN** user sends POST `/v1/auth/reset-verify` with a valid, non-expired token
- **THEN** system returns 200 OK with `{"verified": true}`
- **AND** marks the token as consumed

#### Scenario: User verifies an expired reset token
- **WHEN** user sends POST `/v1/auth/reset-verify` with a token older than 1 hour
- **THEN** system returns 401 Unauthorized with error "Reset token has expired"

#### Scenario: User verifies an invalid or consumed token
- **WHEN** user sends POST `/v1/auth/reset-verify` with an invalid or already-consumed token
- **THEN** system returns 401 Unauthorized with error "Invalid reset token"

#### Scenario: User changes password with valid token
- **WHEN** user sends PUT `/v1/auth/reset-change` with valid token, new password (6+ chars), and matching confirmation
- **THEN** system updates the password hash
- **AND** clears the reset token and expiration
- **AND** returns 200 OK

#### Scenario: User changes password with non-matching confirmation
- **WHEN** user sends PUT `/v1/auth/reset-change` with new password and non-matching confirmation
- **THEN** system returns 400 Bad Request with error "Passwords do not match"

#### Scenario: User changes password with short password
- **WHEN** user sends PUT `/v1/auth/reset-change` with new password shorter than 6 characters
- **THEN** system returns 400 Bad Request with field-level error "Password must be at least 6 characters"
