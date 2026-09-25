# Spec Delta

## ADDED Requirements

### Requirement: Password Reset Request Endpoint
The system SHALL accept a POST request to `/v1/auth/reset-request` with a valid registered email address. The system SHALL generate a 6-character alphanumeric reset token, store it with an expiration of 1 hour in the `users` table, and return the token in the response body. No email service SHALL be used.

**Affected files**:
- `com.example.todo.controller.AuthController` — new `POST /v1/auth/reset-request` method
- `com.example.todo.service.UserService` — new `requestReset(String email)` method
- `com.example.todo.dto.ResetRequestDto` — new DTO with `email` field (`@NotBlank @Email`)
- `com.example.todo.model.User` — new fields `resetToken` (VARCHAR(255)), `resetExpires` (TIMESTAMP)
- `com.example.todo.repository.UserRepository` — new method `findByResetToken(String token)`

**DB**: `db/migration/V3__add_password_reset.sql` — ADD COLUMN reset_token VARCHAR(255), reset_expires TIMESTAMP to users table

#### Scenario: Reset request with valid registered email
- **WHEN** authenticated or unauthenticated user sends POST `/v1/auth/reset-request` with `{"email": "user@example.com"}`
- **THEN** system generates a 6-character alphanumeric token
- **AND** stores the token in the `users` table with `reset_expires` set to 1 hour from now
- **AND** returns 200 OK with body `{"token": "ABC123"}`

#### Scenario: Reset request with unregistered email is silent
- **WHEN** user sends POST `/v1/auth/reset-request` with an email that does not exist
- **THEN** system returns 200 OK with body `{"token": ""}` (empty token, no information disclosure)
- **AND** no token is stored in the database

#### Scenario: Reset request with invalid email format is rejected
- **WHEN** user sends POST `/v1/auth/reset-request` with malformed email (e.g., `notanemail`)
- **THEN** Bean Validation fails on `@Email` constraint for email field
- **AND** system returns 400 Bad Request with field-level error details

### Requirement: Password Reset Verification Endpoint
The system SHALL accept a POST request to `/v1/auth/reset-verify` with a reset token. The system SHALL verify the token exists, is not expired (1 hour TTL), and has not been previously consumed. Upon success, the system SHALL return a verification flag.

**Affected files**:
- `com.example.todo.controller.AuthController` — new `POST /v1/auth/reset-verify` method
- `com.example.todo.service.UserService` — new `verifyResetToken(String token)` method
- `com.example.todo.dto.ResetVerifyDto` — new DTO with `token` field (`@NotBlank`)
- `com.example.todo.exception.InvalidResetTokenException` — new exception, returns 401 Unauthorized
- `com.example.todo.exception.GlobalExceptionHandler` — maps to 401

#### Scenario: Valid non-expired token verification succeeds
- **WHEN** user sends POST `/v1/auth/reset-verify` with a valid, non-expired token
- **THEN** system returns 200 OK with body `{"verified": true}`
- **AND** the token is marked as consumed (stored but not cleared yet)

#### Scenario: Expired token verification is rejected
- **WHEN** user sends POST `/v1/auth/reset-verify` with a token older than 1 hour
- **THEN** system returns 401 Unauthorized with error `{"error": "Reset token has expired"}`

#### Scenario: Invalid or consumed token verification is rejected
- **WHEN** user sends POST `/v1/auth/reset-verify` with an invalid or already-consumed token
- **THEN** system returns 401 Unauthorized with error `{"error": "Invalid reset token"}`

### Requirement: Password Reset Change Endpoint
The system SHALL accept a PUT request to `/v1/auth/reset-change` with the reset token, new password, and confirmation. The system SHALL validate that the token is valid and not expired, that the new password meets minimum length (6+ characters), and that the confirmation matches. After successful change, the token SHALL be cleared.

**Affected files**:
- `com.example.todo.controller.AuthController` — new `PUT /v1/auth/reset-change` method
- `com.example.todo.service.UserService` — new `changePasswordViaReset(String token, String newPassword)` method
- `com.example.todo.dto.PasswordChangeDto` — new DTO with `token` (`@NotBlank`), `newPassword` (`@NotBlank @Size(min=6)`), `confirmPassword` (`@NotBlank`)
- `com.example.todo.exception.InvalidResetTokenException` — maps to 400 for password validation errors

#### Scenario: Password change with valid token and matching passwords
- **WHEN** user sends PUT `/v1/auth/reset-change` with valid token, new password (6+ chars), and matching confirmation
- **THEN** system updates the user's password hash (BCrypt)
- **AND** clears `resetToken` and `resetExpires` in the database
- **AND** returns 200 OK

#### Scenario: Password change with non-matching confirmation is rejected
- **WHEN** user sends PUT `/v1/auth/reset-change` with new password and non-matching confirmation
- **THEN** system returns 400 Bad Request with error message "Passwords do not match"

#### Scenario: Password change with short new password is rejected
- **WHEN** user sends PUT `/v1/auth/reset-change` with new password shorter than 6 characters
- **THEN** Bean Validation fails on `@Size(min=6)` constraint
- **AND** system returns 400 Bad Request with field-level error details

### Requirement: Frontend Password Reset Pages
The system SHALL expose two new routes: `/forgot-password` for requesting a reset token, and `/reset/:token` for verifying the token and changing the password. The login page SHALL include a "Forgot password?" link pointing to `/forgot-password`.

**Affected files**:
- `frontend/src/pages/ForgotPasswordPage.tsx` — new page, email input, display generated token, link to reset
- `frontend/src/pages/ForgotPasswordPage.module.css` — new styles
- `frontend/src/pages/ResetPasswordPage.tsx` — new page, token display, new password input, confirm password
- `frontend/src/pages/ResetPasswordPage.module.css` — new styles
- `frontend/src/pages/LoginPage.tsx` — add "Forgot password?" link to `/forgot-password`
- `frontend/src/App.tsx` — add routes `/forgot-password` and `/reset/:token`
- `frontend/src/services/ApiService.ts` — new endpoints: `requestReset(email)`, `verifyResetToken(token)`, `changePasswordReset(token, newPassword)`

#### Scenario: User requests password reset from login page
- **WHEN** user clicks "Forgot password?" link on the login page
- **THEN** system navigates to `/forgot-password`
- **AND** displays a form with email input and "Send reset code" button

#### Scenario: User receives reset token and proceeds to reset
- **WHEN** user enters their email on the forgot password page
- **THEN** system displays the generated 6-character token
- **AND** displays a "Continue to reset" link that navigates to `/reset/:token`

#### Scenario: User changes password via reset flow
- **WHEN** user navigates to `/reset/:token` with a valid token
- **THEN** system displays a form with new password and confirm password inputs
- **AND** upon successful submission, navigates the user to `/login`
