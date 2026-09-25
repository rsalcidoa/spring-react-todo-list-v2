# Spec Delta — password-reset (operación única + body coherente)

## MODIFIED Requirements

### Requirement: Password Reset Verification
The system SHALL allow users to verify their password reset token by entering the code received in the previous step. Verification is read-only: it returns a flag that allows the user to proceed to password change. Token validity (lookup + non-expiry) SHALL be decided in exactly one place inside the user module and shared by verification and change. Token invalidation happens only on successful password change, not on verification.

**ID**: REQ-PR-002
**Affected files**:
- `com.example.todo.service.UserService` — single internal validity check used by `verifyResetToken` and `changePasswordViaReset`; injectable clock

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
The system SHALL allow verified users to change their password by providing the reset token, the new password, and confirmation. Equality of new password and confirmation SHALL be enforced by the user module's change operation itself, not by the controller. The system SHALL validate the new password meets minimum length requirements (6+ characters). After successful change, the reset token SHALL be invalidated. Error bodies on this seam SHALL always carry the contract message (never an empty body where the frontend expects `data.error`).

**ID**: REQ-PR-003
**Affected files**:
- `com.example.todo.controller.AuthController` — thin delegate to `UserService.changePasswordViaReset(token, newPassword, confirmPassword)`
- `com.example.todo.service.UserService` — owns equality + validity + hashing + invalidation
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
- **THEN** system returns 400 Bad Request with error message "Password must be at least 6 characters"
