# Spec Delta

## ADDED Requirements

### Requirement: Silent Token Refresh on 401
The session module SHALL persist the refresh token alongside the access token. On a `401` for a non-login request, the shared Axios instance SHALL attempt exactly one silent refresh via `POST /v1/auth/refresh`, and on success retry the original request with the new access token. Concurrent `401`s SHALL trigger a single refresh (single-flight). If the refresh fails, the session SHALL be cleared and the user redirected to `/login` (existing behavior). The login request itself SHALL never trigger a refresh.

**ID**: REQ-FE-025
**Affected files**:
- `frontend/src/services/session.ts` — store/get/clear the refresh token
- `frontend/src/services/ApiService.ts` — response interceptor: single-flight refresh + one retry
- `frontend/src/context/AuthContext.tsx` — persists both tokens on login

#### Scenario: Expired access token is refreshed transparently
- **WHEN** a request fails with 401 because the access token expired and a valid refresh token exists
- **THEN** the client refreshes once, retries the request, and the caller receives the successful response

#### Scenario: Refresh failure logs out
- **WHEN** the refresh request fails (expired/rotated)
- **THEN** the session is cleared and the user is redirected to `/login`

#### Scenario: Single refresh under concurrency
- **WHEN** several requests receive 401 at the same time
- **THEN** only one refresh request is sent and the others wait for its result

#### Scenario: Login is not refreshed
- **WHEN** `/auth/login` returns 401
- **THEN** no refresh is attempted and the error propagates to the caller
