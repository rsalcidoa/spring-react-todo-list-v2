# frontend-integration Specification

## Purpose
Provides React frontend integration with the REST API for task management.

## Requirements

### Requirement: Task List View
The system SHALL display all tasks grouped by status with per-column counts (tabular numerals) and a board total. Each task SHALL show its due-state derived from `dueDate` against the local date: `overdue` (past), `today`, `future`, or `none` (no date). A tag filter in the board header SHALL narrow visible tasks to those carrying any selected tag. Loading SHALL show skeletons; an empty board SHALL show an actionable empty state (with a create CTA) while empty columns show a plain "Sin tareas" text. Failed moves SHALL roll back visibly and surface the failure through the transient error banner.

#### Scenario: User Views Task List
- **WHEN** user navigates to /tasks page
- **THEN** system displays the user's tasks grouped into status columns on the Kanban board

#### Scenario: User sees counts and due-states at a glance
- **WHEN** user opens `/tasks` with tasks across statuses and dates
- **THEN** each column shows its count, the header shows the total, overdue tasks carry the `overdue` treatment, today's the `today` treatment, and dateless tasks show no due chip

#### Scenario: User filters by tag
- **WHEN** user selects one or more tags in the header filter
- **THEN** only tasks carrying any selected tag are shown; clearing restores all

#### Scenario: Drop target is visible and failure is explained
- **WHEN** user drags a task over a column
- **THEN** the column highlights as a valid target; on failed `move` the task visibly rolls back and the transient error banner names the failure

#### Scenario: Loading and empty states guide
- **WHEN** tasks/tags are loading
- **THEN** skeletons occupy the board; WHEN the board is empty THEN an empty state with a create CTA is shown, and WHEN a column is empty it shows a plain "Sin tareas" text

### Requirement: Create Task Form
The system SHALL provide a form to create new tasks with title, description, priority, and due date. The form SHALL validate inline: empty title blocks submit with a field-level message (no round-trip). Creating a tag SHALL assign it in the same step. Deleting a tag assigned to N tasks SHALL ask for confirmation naming the impact.

#### Scenario: User Creates New Task
- **WHEN** user fills form and clicks "Create"
- **THEN** system adds task to list and shows success message

#### Scenario: Empty title is blocked inline
- **WHEN** user submits with an empty title
- **THEN** submit is prevented with a field-level message and no request is sent

#### Scenario: Tag create-and-assign in one step
- **WHEN** user types a new tag name and confirms
- **THEN** the tag is created, selected, and saved with the task without extra clicks

### Requirement: Edit Task Functionality
The system SHALL allow users to edit existing tasks.

#### Scenario: User Edits Task
- **WHEN** user clicks edit button on a task and saves changes
- **THEN** system updates the task in the list

### Requirement: Delete Task Functionality
The system SHALL allow users to delete tasks. The frontend SHALL extract task data operations into a `TaskRepository` module that owns the board operations `fetchAll`, `create`, `update`, `move`, `remove`, and `listTags` (see `Board Task Repository Operations`).

**Affected files**:
- `frontend/src/components/KanbanCard.tsx` — delete button (`onDelete?: () => void` prop; renders a delete icon/button in the card header)
- `frontend/src/components/KanbanColumn.tsx` — pass `onDelete` to each `KanbanCard`
- `frontend/src/pages/TodoListPage.tsx` — wire `handleDelete` to the repository's `remove()` method; refresh tags after create/update
- `frontend/src/data/TaskRepository.ts` — module (interface + `HttpTaskRepository` over ApiService + `InMemoryTaskRepository`); `remove(id)` (renamed from `delete`) and `move(id, status)` (renamed from `patchStatus`)

#### Scenario: User Deletes Task
- **WHEN** user clicks delete button on a task
- **THEN** system removes task from list and shows confirmation (via `window.confirm`)
- **AND** the delete operation goes through `TaskRepository.remove(id)`

### Requirement: Board Task Repository Operations
The frontend task data layer SHALL expose board operations through the `TaskRepository` interface with domain types: `fetchAll(): Promise<Task[]>`, `create(input: TaskInput): Promise<Task>`, `update(id: number, input: TaskInput): Promise<Task>`, `move(id: number, status: TaskStatus): Promise<void>`, `remove(id: number): Promise<void>`, `listTags(): Promise<Tag[]>`, `createTag(name: string): Promise<Tag>`, `deleteTag(id: number): Promise<void>`. `update` SHALL return the updated `Task` so callers do not patch local state by hand. `createTag` SHALL return the backend tag with its real id (no client-generated ids). The wire format MUST be owned exclusively by the repository adapters. Both adapters (`HttpTaskRepository`, `InMemoryTaskRepository`) SHALL share semantics: tag identity trimmed and case-insensitive, and operations on missing ids SHALL reject (no silent no-ops). Error mapping SHALL be shared: one interpretation of the HTTP contract used by page and modal alike. No `any` cast may hide the domain↔wire conversion.

**ID**: REQ-FE-009
**Affected files**:
- `frontend/src/data/TaskRepository.ts` — deep interface + `HttpTaskRepository` (owns domain↔wire conversion) + `InMemoryTaskRepository`
- `frontend/src/services/types/task.ts` — `TaskInput` type
- `frontend/src/services/ApiService.ts` — `updateTask` accepts a typed input instead of `any`
- `frontend/src/pages/TodoListPage.tsx` — handlers use `TaskInput` (no `as any`)
- `frontend/src/components/AddTaskModal.tsx` — `onSave` receives `TaskInput` (no `any`)

#### Scenario: Domain input with tag names reaches the wire
- **WHEN** a caller invokes `create(input)` with `input.tagNames = ["Work", "Personal"]`
- **THEN** the wire request body sent to `/v1/tasks` contains `"tagNames": ["Work", "Personal"]`
- **AND** the task is stored with exactly those tags (no silent tag loss)

#### Scenario: Wire task responses map to the domain type
- **WHEN** `fetchAll()` receives wire task objects with `tags: [{id, name}]`
- **THEN** the returned `Task[]` contains, per task, a `tags: Tag[]` array with `id` and `name` per tag and a status value among `PENDING`, `ACTIVE`, `COMPLETED`

#### Scenario: move transitions a task status
- **WHEN** a caller invokes `move(id, "COMPLETED")`
- **THEN** the task's status becomes `COMPLETED` (in `HttpTaskRepository`: PATCH `/v1/tasks/{id}/status` with `{"status": "COMPLETED"}`; in `InMemoryTaskRepository`: the stored task is updated)
- **AND** a failed `move` rejects so the caller can roll back optimistic state

#### Scenario: remove deletes a task
- **WHEN** a caller invokes `remove(id)` with confirmation from the caller
- **THEN** the task is no longer returned by `fetchAll()` (in `HttpTaskRepository`: DELETE `/v1/tasks/{id}`; in `InMemoryTaskRepository`: the stored task is removed)

#### Scenario: In-memory adapter implements the full interface without network
- **WHEN** a test drives the full board flow — `fetchAll`, `create`, `update`, `move`, `remove`, `listTags`, `createTag`, `deleteTag` — against `InMemoryTaskRepository`
- **THEN** every operation completes with correct in-memory state and zero network requests

#### Scenario: Created tag carries the real id
- **WHEN** a caller invokes `createTag("Work")`
- **THEN** the returned `Tag` carries the backend-assigned `id` (never a client-fabricated one)
- **AND** the tag appears in `listTags()` without a manual refresh hack

#### Scenario: Shared error mapping
- **WHEN** any repository operation fails with `409`, `400` or `404`
- **THEN** the caller receives the contract message through one shared mapping used by page and modal alike

### Requirement: API Integration
The system SHALL communicate with the backend REST API, automatically including `Authorization: Bearer <token>` header on every authenticated request via an Axios interceptor. Session storage and the 401 policy SHALL live in exactly one place: the session module (`getToken`, `saveSession`, `clearSession`, `handleUnauthorized`). All styles SHALL consume the design token contract in `frontend/src/styles/theme.css` (no literal colors outside it). Every ApiService function must use a shared axios instance created via `axios.create({ baseURL: '/v1' })` that includes both auth interceptor and response error handler for 401 redirects. **All authentication calls must also use this shared instance.**

**Affected files**: 
- `frontend/src/services/session.ts` — new module owning keys and 401 policy
- `frontend/src/services/ApiService.ts` — interceptors delegate to the session module
- `frontend/src/context/AuthContext.tsx` — `login()`/`logout()` delegate persistence (same React interface)
- `frontend/src/context/AuthContext.tsx` — `login()` uses `api.post('/auth/login', ...)` (no global axios import)
- `frontend/src/pages/RegisterPage.tsx` — calls `api.post('/auth/register', …)` directly (no `AuthService` indirection); catch block reads `error.response?.status` and `error.response.data.error` for 409 responses; displays structured error message from backend

#### Scenario: Axios Interceptor Adds Auth Header to All Requests
- **WHEN** user navigates to /tasks or performs any CRUD action on a task
- **THEN** Axios interceptor reads `localStorage.getItem('jwt')` and adds `Authorization: Bearer <token>` header to the request before sending
- **AND** system returns 201 Created (POST), 200 OK (PUT) or 204 No Content (DELETE)

#### Scenario: Unauthenticated User Redirects to Login
- **WHEN** stored token in localStorage does not exist or has been invalidated by backend
- **THEN** Axios interceptor catches the 401 response, clears `localStorage` entries for jwt and email, and redirects user to /login

#### Scenario: Auth Calls Use the Shared API Instance
- **WHEN** user logs in via AuthContext or registers via RegisterPage
- **THEN** all auth requests (login, register) go through the shared api instance from ApiService, not a direct axios import

#### Scenario: Session policy is unit-testable without network
- **WHEN** a `401` arrives for a non-login request
- **THEN** the session is cleared and navigation to `/login` happens through the module (covered without HTTP mocks)

#### Scenario: Token refactor has zero visual change
- **WHEN** the token migration is applied
- **THEN** board, modal, auth pages and banners render pixel-identical to the pre-migration screenshot baseline

### Requirement: Registration Page Route
The system SHALL expose a `/register` route that displays the registration form, accepts email and password, calls `POST /v1/auth/register` directly, auto-login after successful registration, and navigates to /tasks.

**Affected files**: 
- `frontend/src/App.tsx` — add `<Route path="/register" element={<RegisterPage />} />` before catch-all route
- `frontend/src/pages/RegisterPage.tsx` — call `api.post('/auth/register', …)`; on success auto-login then navigate to /tasks
- `frontend/src/pages/LoginPage.tsx` — add Link component "¿No tienes cuenta? Regístrate" pointing to `/register`

#### Scenario: User Navigates to Register Route
- **WHEN** user visits URL `/register` or clicks "Regístrate" link from login page
- **THEN** system displays the registration form with email and password fields

#### Scenario: Successful Registration Triggers Auto-login Redirect
- **WHEN** user submits valid credentials via the register form
- **THEN** system calls POST /v1/auth/register directly
- **AND** upon 201 Created response, automatically calls POST /v1/auth/login with same credentials
- **AND** after receiving JWT token, navigates to `/tasks` page

#### Scenario: Registration Form Has Navigation Link to Login
- **WHEN** user is on the registration page and already has an account
- **THEN** system displays a link "¿Ya tienes cuenta? Inicia sesión" pointing to /login

### Requirement: Tag List Refresh
The system SHALL refresh the available tags list in the task board after a successful task creation or update that may have introduced new tags, so the user sees the new tags immediately without a page reload.

**ID**: REQ-FE-008
**Affected files**: 
- `frontend/src/pages/TodoListPage.tsx` — after `createTask` or `updateTask` success, call `loadTags()` (`repository.listTags()` + `setTags`) to update tags state
- `frontend/src/data/TaskRepository.ts` — `listTags()` read used for refresh (no dedicated `refreshTags()` method)
- `frontend/src/components/AddTaskModal.tsx` — receives updated `existingTags` prop

#### Scenario: New tag appears after task creation without reload
- **WHEN** user creates a task with a new tag name via the `AddTaskModal`
- **THEN** the board refreshes the tags list and the new tag appears in the dropdown of `AddTaskModal` without requiring a page reload

### Requirement: Client-side Email Validation
The system SHALL validate email format on the frontend before submitting login or registration requests, using a regex pattern that checks for `localpart@domain.tld` structure. Invalid format SHALL display an inline error message via the ErrorBanner component and prevent form submission.

**ID**: REQ-FE-010
**Affected files**:
- `frontend/src/pages/LoginPage.tsx` — `validateEmail()` helper, check before `login()` call
- `frontend/src/pages/RegisterPage.tsx` — `validateEmail()` helper, check before submit

#### Scenario: Valid email passes frontend validation
- **WHEN** user enters `usuario@dominio.com` in the login or register email field
- **THEN** the regex check passes and the form submits to the backend

#### Scenario: Invalid email blocked before submission
- **WHEN** user enters `mail@mail` or `notanemail` in the email field
- **THEN** the frontend validation fails and an ErrorBanner is displayed with message "Formato de email inválido"
- **AND** the form does not submit to the backend

#### Scenario: Empty email blocked by HTML5 required
- **WHEN** user submits the form with an empty email field
- **THEN** the HTML5 `required` attribute blocks submission

### Requirement: ErrorBanner Toast Component
The system SHALL provide a shared `ErrorBanner` component that displays error messages as a floating toast in the upper-right corner of the viewport. The banner SHALL auto-hide after 5 seconds and use CSS custom property `--color-danger` for text color. Only one banner is shown at a time: a new error replaces the previous one (single `error` state per page).

**ID**: REQ-FE-011
**Affected files**:
- `frontend/src/components/ErrorBanner.tsx` — new component
- `frontend/src/components/ErrorBanner.module.css` — new styles
- `frontend/src/pages/LoginPage.tsx` — replace `styles.field` with `styles.error` for error messages
- `frontend/src/pages/RegisterPage.tsx` — replace `alert()` calls with ErrorBanner
- `frontend/src/pages/TodoListPage.tsx` — replace `console.error()` with ErrorBanner for API errors

#### Scenario: ErrorBanner displays on error
- **WHEN** an API call returns a non-2xx status
- **THEN** ErrorBanner is rendered in the upper-right corner with the error message
- **AND** the banner auto-hides after 5 seconds

#### Scenario: ErrorBanner replaces the previous error
- **WHEN** two errors occur within 5 seconds of each other
- **THEN** the newest message replaces the previous one (single banner visible)

#### Scenario: ErrorBanner replaces alert() dialogs
- **WHEN** registration fails with 409 Conflict
- **THEN** ErrorBanner displays the error message instead of a browser `alert()`

### Requirement: Status Default PENDING in Task Creation
The system SHALL display the status field pre-selected to `PENDING` and disabled when creating a new task in the `AddTaskModal`. When editing an existing task, the status field SHALL be enabled and editable.

**ID**: REQ-FE-012
**Affected files**:
- `frontend/src/components/AddTaskModal.tsx` — conditional disable of status select based on `editingTask`
- `frontend/src/services/types/task.ts` — status defaults documented in `TaskInput`

#### Scenario: Status is PENDING and disabled when creating new task
- **WHEN** user opens the task creation modal (no `editingTask`)
- **THEN** the status dropdown shows `PENDING` as the selected value
- **AND** the status dropdown is disabled and cannot be changed

#### Scenario: Status is editable when editing existing task
- **WHEN** user opens the task edit modal (with `editingTask` set)
- **THEN** the status dropdown shows the task's current status
- **AND** the user can change the status to any valid value (PENDING, ACTIVE, COMPLETED)

### Requirement: Tag Creation from Modal
The system SHALL allow authenticated users to create new tags directly from the `AddTaskModal` via an input field and a "Create" button. Creation SHALL go through `TaskRepository.createTag()` and use the returned real `id`; the tag SHALL be immediately added to the available tags list without page reload.

**ID**: REQ-FE-013
**Affected files**:
- `frontend/src/components/AddTaskModal.tsx` — new tag input, create button, repository call (no direct `ApiService` import)
- `frontend/src/pages/TodoListPage.tsx` — refresh via repository state

#### Scenario: User creates a new tag from the modal
- **WHEN** user types a tag name (1-50 chars) in the new tag input and clicks "Create"
- **THEN** the system creates the tag via the repository and it appears in the tag pills list with its real id
- **AND** no client-fabricated id ever reaches task reconciliation

#### Scenario: Duplicate tag creation is rejected
- **WHEN** user attempts to create a tag that already exists for the user
- **THEN** the system returns 409 Conflict
- **AND** the ErrorBanner displays the duplicate error message

#### Scenario: Blank tag name is rejected
- **WHEN** user clicks "Create" with an empty or whitespace-only input
- **THEN** the backend returns 400 Bad Request
- **AND** the ErrorBanner displays the validation error

### Requirement: Tag Deletion from Modal
The system SHALL allow authenticated users to delete tags directly from the `AddTaskModal` by clicking a delete button (×) on each existing tag pill. Upon successful deletion, the tag SHALL be removed from the available tags list via `loadTags()` refresh without page reload.

**ID**: REQ-FE-014
**Affected files**:
- `frontend/src/components/AddTaskModal.tsx` — delete button (×) on each tag pill, `deleteTag()` call
- `frontend/src/pages/TodoListPage.tsx` — tags refreshed after deletion via `loadTags()`

#### Scenario: User deletes a tag from the modal
- **WHEN** user clicks the delete button (×) on an existing tag pill
- **THEN** the system calls `DELETE /v1/tags/{id}`
- **AND** the tag is removed from the tag pills list after `loadTags()` refresh
- **AND** the tag is unassigned from all associated tasks (backend behavior)

#### Scenario: Delete of non-existent tag returns 404
- **WHEN** user attempts to delete a tag that does not exist
- **THEN** the system returns 404 Not Found
- **AND** the ErrorBanner displays the error message

### Requirement: Password Reset Backend Endpoints (reference)
Backend endpoints `POST /v1/auth/reset-request`, `POST /v1/auth/reset-verify` and `PUT /v1/auth/reset-change` SHALL behave as specified canonically in `password-reset` (REQ-PR-001..003). This spec only covers the frontend pages (REQ-FE-018).

#### Scenario: Canonical reset behavior applies
- **WHEN** a client calls the backend reset endpoints
- **THEN** the system behaves per `password-reset` REQ-PR-001..003

### Requirement: Frontend Password Reset Pages
The system SHALL expose two new routes: `/forgot-password` for requesting a reset token, and `/reset/:token` for verifying the token and changing the password. The login page SHALL include a "Forgot password?" link pointing to `/forgot-password`.

**ID**: REQ-FE-018
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

#### Scenario: User copies the reset token
- **WHEN** the token is displayed on the forgot-password page
- **THEN** a copy action places it on the clipboard and confirms (the reset page itself reads the token from the `/reset/:token` URL and does not display it)

#### Scenario: Reset errors direct action
- **WHEN** reset fails for an expired token or a request error
- **THEN** the message names the fix (request a new code / retry) instead of only describing the failure
