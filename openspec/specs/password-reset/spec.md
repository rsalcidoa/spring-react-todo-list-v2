# password-reset Specification

## Purpose
Provides a password recovery flow for users who forget their password, using a manually-entered verification code since no email service is available.

## Requirements

### Requirement: Password Reset Request
The system SHALL allow unauthenticated users to request a password reset by entering their registered email address. Upon request, the system SHALL generate a 6-character alphanumeric reset token, store it with an expiration time of 1 hour, and return the token to the client in the response body (since no email service is available).

**ID**: REQ-PR-001
**Affected files**:
- `com.example.todo.controller.AuthController` — new endpoint `POST /v1/auth/reset-request`
- `com.example.todo.service.UserService` — new method `requestReset(String email)`
- `com.example.todo.dto.ResetRequestDto` — new DTO, `email` field with `@NotBlank @Email`
- `com.example.todo.model.User` — fields `resetToken` (VARCHAR), `resetExpires` (TIMESTAMP)
- `db/migration/V3__add_password_reset.sql` — migration ADD COLUMN reset_token, reset_expires

#### Scenario: Reset request with valid email succeeds
- **WHEN** user sends POST `/v1/auth/reset-request` with a valid registered email
- **THEN** system generates a 6-character alphanumeric token
- **AND** stores the token and sets `resetExpires` to 1 hour from now
- **AND** returns 200 OK with body `{"token": "ABC123"}`

#### Scenario: Reset request with non-existent email is silent
- **WHEN** user sends POST `/v1/auth/reset-request` with an unregistered email
- **THEN** system returns 200 OK with an empty token `{"token": ""}` (no info disclosure)
- **AND** no token is stored in the database

#### Scenario: Reset request with invalid email format is rejected
- **WHEN** user sends POST `/v1/auth/reset-request` with malformed email (e.g., `notanemail`)
- **THEN** Bean Validation fails on `@Email` constraint
- **AND** system returns 400 Bad Request with field-level error details

### Requirement: Password Reset Verification
The system SHALL allow users to verify their password reset token by entering the code received in the previous step. Verification is read-only: it returns a flag that allows the user to proceed to password change. Token validity (lookup + non-expiry) SHALL be decided in exactly one place inside the user module and shared by verification and change. Token invalidation happens only on successful password change, not on verification.

**ID**: REQ-PR-002
**Affected files**:
- `com.example.todo.controller.AuthController` — endpoint `POST /v1/auth/reset-verify` (thin delegate)
- `com.example.todo.service.UserService` — single internal validity check used by `verifyResetToken` and `changePasswordViaReset`; injectable clock
- `com.example.todo.dto.ResetVerifyDto` — DTO, `token` field with `@NotBlank`
- `com.example.todo.exception.InvalidResetTokenException` — exception class
- `com.example.todo.exception.GlobalExceptionHandler` — maps to 401 Unauthorized

#### Scenario: Valid reset token verification succeeds
- **WHEN** user sends POST `/v1/auth/reset-verify` with a valid, non-expired token
- **THEN** system returns 200 OK with body `{"verified": true}`
- **AND** the token remains valid for a subsequent password change (consumed only by `PUT /v1/auth/reset-change`)

#### Scenario: Expired reset token is rejected
- **WHEN** user sends POST `/v1/auth/reset-verify` with a token older than 1 hour
- **THEN** system returns 401 Unauthorized with error message "Reset token has expired"

#### Scenario: Invalid or consumed reset token is rejected
- **WHEN** user sends POST `/v1/auth/reset-verify` with an invalid or already-used token
- **THEN** system returns 401 Unauthorized with error message "Invalid reset token"

### Requirement: Password Reset Change
The system SHALL allow verified users to change their password by providing the reset token, the new password, and confirmation. Equality of new password and confirmation SHALL be enforced by the user module's change operation itself, not by the controller. The system SHALL validate the new password meets minimum length requirements (6+ characters). After successful change, the reset token SHALL be invalidated. Error bodies on this seam SHALL always carry the contract message.

**ID**: REQ-PR-003
**Affected files**:
- `com.example.todo.controller.AuthController` — thin delegate to `UserService.changePasswordViaReset(token, newPassword, confirmPassword)`
- `com.example.todo.service.UserService` — owns equality + validity + hashing + invalidation
- `com.example.todo.dto.PasswordChangeDto` — DTO, `token`, `newPassword`, `confirmPassword` fields (transport only)
- `com.example.todo.model.User` — existing `password` field updated via setter
- `com.example.todo.exception.GlobalExceptionHandler` — shared body builder; coherent `{error}` bodies

#### Scenario: Password change with valid token succeeds
- **WHEN** user sends PUT `/v1/auth/reset-change` with valid token, new password (6+ chars), and matching confirmation
- **THEN** system updates the user's password hash
- **AND** clears the `resetToken` and `resetExpires` fields
- **AND** returns 200 OK

#### Scenario: Password change with mismatched confirmation is rejected
- **WHEN** user sends PUT `/v1/auth/reset-change` with new password and non-matching confirmation
- **THEN** system returns 400 Bad Request with error message "Passwords do not match"

#### Scenario: Password change with short new password is rejected
- **WHEN** user sends PUT `/v1/auth/reset-change` with new password shorter than 6 characters
- **THEN** Bean Validation fails on `@Size(min=6)` and the system returns 400 Bad Request with field-level details `{"error":"Validation failed","errors":{"newPassword":["Password must be at least 6 characters"]}}`

### Requirement: Frontend Forgot Password Page
The system SHALL expose a `/forgot-password` route that displays a form for the user to enter their email address. Upon successful request, the system SHALL display the generated 6-character token to the user and provide a link to the reset page using that token.

**ID**: REQ-PR-004
**Affected files**:
- `frontend/src/pages/ForgotPasswordPage.tsx` — new page component
- `frontend/src/pages/ForgotPasswordPage.module.css` — new styles
- `frontend/src/pages/LoginPage.tsx` — add "Forgot password?" link pointing to `/forgot-password`
- `frontend/src/App.tsx` — add route `<Route path="/forgot-password" element={<ForgotPasswordPage />} />`
- `frontend/src/services/ApiService.ts` — new endpoint `requestReset(email: string)`

#### Scenario: User requests password reset
- **WHEN** user clicks "Forgot password?" link from the login page and enters their email
- **THEN** system calls POST `/v1/auth/reset-request`
- **AND** system displays the generated 6-character token to the user
- **AND** displays a link "Continue to reset" that navigates to `/reset/:token`

#### Scenario: Reset link passes token as URL parameter
- **WHEN** user clicks "Continue to reset" from the forgot password page
- **THEN** the browser navigates to `/reset/<token>` where `<token>` is the displayed 6-character code

### Requirement: Frontend Reset Password Page
The system SHALL expose a `/reset/:token` route that displays a form for the user to enter the 6-character verification code and a new password. The system SHALL first verify the token, then allow password change upon successful verification.

**ID**: REQ-PR-005
**Affected files**:
- `frontend/src/pages/ResetPasswordPage.tsx` — new page component
- `frontend/src/pages/ResetPasswordPage.module.css` — new styles
- `frontend/src/App.tsx` — add route `<Route path="/reset/:token" element={<ResetPasswordPage />} />`
- `frontend/src/services/ApiService.ts` — new endpoints `verifyResetToken(token)` and `changePasswordReset(token, newPassword)`

#### Scenario: User enters verification code and new password
- **WHEN** user navigates to `/reset/:token` and enters the 6-character code along with a new password
- **THEN** system first calls POST `/v1/auth/reset-verify` to validate the token
- **AND** if valid, calls PUT `/v1/auth/reset-change` to update the password
- **AND** navigates the user to `/login` on success

#### Scenario: Expired token shows error
- **WHEN** user navigates to `/reset/:token` with an expired token
- **THEN** system displays an error via ErrorBanner
- **AND** provides a link back to `/forgot-password` to request a new token
