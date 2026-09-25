# Spec Delta — frontend-integration (session module)

## MODIFIED Requirements

### Requirement: API Integration
The system SHALL communicate with the backend REST API, automatically including `Authorization: Bearer <token>` header on every authenticated request via an Axios interceptor. Session storage and the 401 policy SHALL live in exactly one place: the session module (`getToken`, `saveSession`, `clearSession`, `handleUnauthorized`). The interceptor SHALL delegate header injection and 401 handling to it; the auth context SHALL delegate persistence to it. Every ApiService function must use a shared axios instance created via `axios.create({ baseURL: '/v1' })` that includes both auth interceptor and response error handler for 401 redirects. **All authentication calls must also use this shared instance.**

**Affected files**:
- `frontend/src/services/session.ts` — new module owning keys and 401 policy
- `frontend/src/services/ApiService.ts` — interceptors delegate to the session module
- `frontend/src/context/AuthContext.tsx` — `login()`/`logout()` delegate persistence (same React interface)

#### Scenario: Axios Interceptor Adds Auth Header to All Requests
- **WHEN** user navigates to /tasks or performs any CRUD action on a task
- **THEN** the interceptor reads the token through the session module and adds `Authorization: Bearer <token>` header to the request before sending
- **AND** system returns 201 Created (POST), 200 OK (PUT) or 204 No Content (DELETE)

#### Scenario: Unauthenticated User Redirects to Login
- **WHEN** stored token in localStorage does not exist or has been invalidated by backend
- **THEN** the session module clears `jwt` and `email` and redirects user to /login (except for `/auth/login` itself, which rejects without redirect)

#### Scenario: Auth Calls Use the Shared API Instance
- **WHEN** user logs in via AuthContext or registers via AuthService
- **THEN** all auth requests (login, register) go through the shared api instance from ApiService, not a direct axios import

#### Scenario: Session policy is unit-testable without network
- **WHEN** a `401` arrives for a non-login request
- **THEN** the session is cleared and navigation to `/login` happens through the module (covered without HTTP mocks)
