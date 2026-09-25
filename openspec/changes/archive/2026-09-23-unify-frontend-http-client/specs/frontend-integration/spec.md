# Spec Delta — frontend-integration

## MODIFIED Requirements

### Requirement: API Integration

The system SHALL communicate with the backend REST API, automatically including `Authorization: Bearer <token>` header on every authenticated request via an Axios interceptor. Every ApiService function must use a shared axios instance created via `axios.create({ baseURL: '/v1' })` that includes both auth interceptor and response error handler for 401 redirects. **All authentication calls must also use this shared instance.**

**Affected files**: 
- `frontend/src/services/ApiService.ts` — existing shared instance, no changes (already compliant)
- `frontend/src/context/AuthContext.tsx` — `login()` now uses `api.post('/auth/login', ...)` instead of `axios.post('/v1/auth/login', ...)` (import de axios global eliminado)
- `frontend/src/services/AuthService.ts` — `registerUser()` now uses `api.post('/auth/register', ...)` instead of dynamic `import('axios')` + `axios.post('/v1/auth/register', ...)`
- `frontend/src/pages/RegisterPage.tsx` — catch block reads `error.response?.status` and `error.response.data.error` for 409 responses; displays structured error message from backend

#### Scenario: Axios Interceptor Adds Auth Header to All Requests
- **WHEN** user navigates to /tasks or performs any CRUD action on a task
- **THEN** Axios interceptor reads `localStorage.getItem('jwt')` and adds `Authorization: Bearer <token>` header to the request before sending
- **AND** system returns 201 Created (POST), 200 OK (PUT) or 204 No Content (DELETE)

#### Scenario: Unauthenticated User Redirects to Login
- **WHEN** stored token in localStorage does not exist or has been invalidated by backend
- **THEN** Axios interceptor catches the 401 response, clears `localStorage` entries for jwt and email, and redirects user to /login

#### Scenario: Auth Calls Use the Shared API Instance
- **WHEN** user logs in via AuthContext or registers via AuthService
- **THEN** all auth requests (login, register) go through the shared api instance from ApiService, not a direct axios import
