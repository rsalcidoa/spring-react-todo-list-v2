# Spec Delta

## ADDED Requirements

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
