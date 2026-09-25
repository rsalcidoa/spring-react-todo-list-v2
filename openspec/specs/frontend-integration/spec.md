# frontend-integration Specification

## Purpose
Provides React frontend integration with the REST API for task management.

## Requirements

### Requirement: Task List View
The system SHALL display all tasks in a list format showing title, priority, and due date.

#### Scenario: User Views Task List
- **WHEN** user navigates to /tasks page
- **THEN** system displays all user's tasks in a scrollable list

### Requirement: Create Task Form
The system SHALL provide a form to create new tasks with title, description, priority, and due date.

#### Scenario: User Creates New Task
- **WHEN** user fills form and clicks "Create"
- **THEN** system adds task to list and shows success message

### Requirement: Edit Task Functionality
The system SHALL allow users to edit existing tasks.

#### Scenario: User Edits Task
- **WHEN** user clicks edit button on a task and saves changes
- **THEN** system updates the task in the list

### Requirement: Delete Task Functionality
The system SHALL allow users to delete tasks. The frontend SHALL extract task data operations into a `TaskRepository` module that owns fetch, create, update, delete, patchStatus, and tag management.

**Affected files**: 
- `frontend/src/components/KanbanCard.tsx` — add delete button (`onDelete?: () => void` prop; renders a delete icon/button in the card header)
- `frontend/src/components/KanbanColumn.tsx` — pass `onDelete` to each `KanbanCard`
- `frontend/src/pages/TodoListPage.tsx` — wire `handleDelete` to the repository's `delete()` method; refresh tags after create/update
- `frontend/src/data/TaskRepository.ts` — new module (interface + `HttpTaskRepository` over ApiService)

#### Scenario: User Deletes Task
- **WHEN** user clicks delete button on a task
- **THEN** system removes task from list and shows confirmation (via `window.confirm`)
- **AND** the delete operation goes through `TaskRepository.delete(id)`

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

### Requirement: Tag List Refresh
The system SHALL refresh the available tags list in the task board after a successful task creation or update that may have introduced new tags, so the user sees the new tags immediately without a page reload.

**ID**: REQ-FE-008
**Affected files**: 
- `frontend/src/pages/TodoListPage.tsx` — after `createTask` or `updateTask` success, call `repository.refreshTags()` to update tags state
- `frontend/src/data/TaskRepository.ts` — `refreshTags()` method (fetch tags via ApiService + update internal state)
- `frontend/src/components/AddTaskModal.tsx` — receives updated `existingTags` prop

#### Scenario: New tag appears after task creation without reload
- **WHEN** user creates a task with a new tag name via the `AddTaskModal`
- **THEN** the board refreshes the tags list and the new tag appears in the dropdown of `AddTaskModal` without requiring a page reload
