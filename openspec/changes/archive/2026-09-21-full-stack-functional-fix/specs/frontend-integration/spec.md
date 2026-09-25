# Spec Delta — frontend-integration

## MODIFIED Requirements

### Requirement: API Integration
The system SHALL communicate with the backend REST API, automatically including `Authorization: Bearer <token>` header on every authenticated request via an Axios interceptor. Every ApiService function must use a shared axios instance created via `axios.create({ baseURL: '/v1' })` that includes both the auth interceptor and response error handler for 401 redirects.

**Affected file**: `frontend/src/services/ApiService.ts` — all functions using axios must go through the configured api instance.

#### Scenario: Frontend Makes API Request
- **WHEN** frontend sends GET request to /v1/tasks
- **THEN** system receives JSON response with task array (auth header added by interceptor)

#### Scenario: Axios Interceptor Adds Auth Header to All Requests
- **WHEN** user navigates to /tasks or performs any CRUD action on a task
- **THEN** Axios interceptor reads `localStorage.getItem('jwt')` and adds `Authorization: Bearer <token>` header to the request before sending
- **AND** system returns 201 Created (POST), 200 OK (PUT) or 204 No Content (DELETE)

#### Scenario: Unauthenticated User Redirects to Login
- **WHEN** stored token in localStorage does not exist or has been invalidated by backend
- **THEN** Axios interceptor catches the 401 response, clears `localStorage` entries for jwt and email, and redirects user to /login

## ADDED Requirements

### Requirement: Registration Page Route
The system SHALL expose a `/register` route that displays the registration form, accepts email and password, calls `registerUser()` service, auto-login after successful registration, and navigates to /tasks.

**Affected files**: 
- `frontend/src/App.tsx` — add `<Route path="/register" element={<RegisterPage />} />` before catch-all route
- `frontend/src/pages/RegisterPage.tsx` — call `registerUser(email, password)` from AuthService; on success auto-login then navigate to /tasks
- `frontend/src/pages/LoginPage.tsx` — add Link component "¿No tienes cuenta? Registrarse" pointing to `/register`

#### Scenario: User Navigates to Register Route
- **WHEN** user visits URL `/register` or clicks "Registrarse" link from login page
- **THEN** system displays the registration form with email and password fields

#### Scenario: Successful Registration Triggers Auto-login Redirect
- **WHEN** user submits valid credentials via the register form
- **THEN** system calls POST /v1/auth/register with `registerUser()` service function
- **AND** upon 201 Created response, automatically calls POST /v1/auth/login with same credentials
- **AND** after receiving JWT token, navigates to `/tasks` page

#### Scenario: Registration Form Has Navigation Link to Login
- **WHEN** user is on the registration page and already has an account
- **THEN** system displays a link "¿Ya tienes cuenta? Iniciar sesión" pointing to /login
