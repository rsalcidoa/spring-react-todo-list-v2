# Proposal

## Why

Access tokens expire after 1 hour with no way to renew, so the user is logged out hourly and loses in-progress edits. Block E (confianza/continuidad): add a refresh token so sessions survive across the access-token lifetime.

## What Changes

- Login returns `{ token, refreshToken }`. A new `POST /v1/auth/refresh` exchanges a valid refresh token for a new access token and a rotated refresh token.
- Refresh tokens are opaque random values stored **hashed** with an expiry and revocation, one row per active token per user.
- Frontend: the session module stores the refresh token; on a `401` for a non-login request the shared Axios instance performs a single silent refresh and retries the original request once; if refresh fails, it clears the session and redirects to `/login` (today's behavior).

**Non-goals:**
- Revoke-all-sessions/device management, OAuth/social login, changing the access-token format.

**Rollback plan:** remove the refresh endpoint and the interceptor branch; clients fall back to the current "401 -> logout" behavior. Migration down drops `refresh_tokens`.

## Capabilities

### New Capabilities

- None (extends authentication).

### Modified Capabilities

- `user-authentication`: adds "Refresh Token Issuance" and "Access Token Refresh".
- `frontend-integration`: adds "Silent Token Refresh on 401".

## Impact

- **Backend (Java):** `com.example.todo.controller.AuthController`, `com.example.todo.service.UserService` (or a new `TokenService`), `repository/RefreshTokenRepository`, `model/RefreshToken`, `util/JwtUtil`, migration `V11__add_refresh_tokens.sql`, JWT config.
- **Frontend (TS):** `frontend/src/services/session.ts` (store refresh token), `frontend/src/services/ApiService.ts` (single-flight refresh + retry), `frontend/src/context/AuthContext.tsx`.
- **API:** additive (login response gains a field); existing clients that ignore it keep working until their token expires.
