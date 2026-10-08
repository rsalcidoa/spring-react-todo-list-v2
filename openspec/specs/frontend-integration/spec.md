# frontend-integration Specification

## Purpose
Provides React frontend integration with the REST API for task management.

## Requirements

### Requirement: Task List View
The system SHALL display all tasks grouped by status with per-column counts (tabular numerals) and a board total. Each task SHALL show its due-state derived from `dueDate` against the local date: `overdue` (past), `today`, `future`, or `none` (no date). The board header SHALL provide a debounced search box (title/description), a sort control (field `createdAt|dueDate|priority|title` and direction `asc|desc`), a priority filter, and the existing tag filter; these controls SHALL narrow/order the visible tasks through the repository query. Loading SHALL show skeletons; an empty board SHALL show an actionable empty state (with a create CTA) while empty columns show a plain "Sin tareas" text. Failed moves SHALL roll back visibly and surface the failure through the transient error banner.

#### Scenario: User Views Task List
- **WHEN** user navigates to /tasks page
- **THEN** system displays the user's tasks grouped into status columns on the Kanban board

#### Scenario: User sees counts and due-states at a glance
- **WHEN** user opens `/tasks` with tasks across statuses and dates
- **THEN** each column shows its count, the header shows the total, overdue tasks carry the `overdue` treatment, today's the `today` treatment, and dateless tasks show no due chip

#### Scenario: User searches tasks
- **WHEN** user types "informe" in the search box
- **THEN** only tasks whose title or description contains "informe" (case-insensitive) remain on the board, and clearing the box restores all tasks

#### Scenario: User sorts the board
- **WHEN** user selects sort `dueDate` ascending
- **THEN** tasks within each column are ordered by dueDate ascending, dateless tasks last

#### Scenario: User filters by priority
- **WHEN** user selects priority `HIGH`
- **THEN** only HIGH-priority tasks remain visible; clearing restores all

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
The frontend task data layer SHALL expose board operations through the `TaskRepository` interface with domain types: `fetchAll(query?: TaskQuery): Promise<Task[]>`, `create(input: TaskInput): Promise<Task>`, `update(id: number, input: TaskInput): Promise<Task>`, `move(id: number, status: TaskStatus): Promise<void>`, `remove(id: number): Promise<void>`, `listTags(): Promise<Tag[]>`, `createTag(name: string): Promise<Tag>`, `deleteTag(id: number): Promise<void>`. `update` SHALL return the updated `Task` so callers do not patch local state by hand. `createTag` SHALL return the backend tag with its real id (no client-generated ids). `fetchAll` SHALL accept an optional domain `TaskQuery` (`q`, `priority`, `tagIds`, `sort`, `dir`, `status`) and the HTTP adapter SHALL own its wire encoding; the in-memory adapter SHALL apply the same semantics. The wire format MUST be owned exclusively by the repository adapters. Both adapters (`HttpTaskRepository`, `InMemoryTaskRepository`) SHALL share semantics: tag identity trimmed and case-insensitive, and operations on missing ids SHALL reject (no silent no-ops). Error mapping SHALL be shared: one interpretation of the HTTP contract used by page and modal alike. No `any` cast may hide the domain<->wire conversion.

**ID**: REQ-FE-009
**Affected files**:
- `frontend/src/data/TaskRepository.ts` — deep interface + `HttpTaskRepository` (owns domain<->wire conversion) + `InMemoryTaskRepository`
- `frontend/src/services/types/task.ts` — `TaskInput` and `TaskQuery` types
- `frontend/src/services/ApiService.ts` — `getTasks(query?)` forwards query params
- `frontend/src/pages/TodoListPage.tsx` — owns the query state, passes it to `fetchAll`
- `frontend/src/components/AddTaskModal.tsx` — `onSave` receives `TaskInput` (no `any`)

#### Scenario: Domain input with tag names reaches the wire
- **WHEN** a caller invokes `create(input)` with `input.tagNames = ["Work", "Personal"]`
- **THEN** the wire request body sent to `/v1/tasks` contains `"tagNames": ["Work", "Personal"]`
- **AND** the task is stored with exactly those tags (no silent tag loss)

#### Scenario: Query reaches the wire
- **WHEN** a caller invokes `fetchAll({ q: "informe", priority: "HIGH", sort: "dueDate", dir: "asc" })`
- **THEN** the HTTP adapter issues `GET /v1/tasks` with `q=informe`, `priority=HIGH`, `sort=dueDate` and `dir=asc` as query parameters
- **AND** the in-memory adapter returns the same filtered/ordered result without a network call

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

### Requirement: Board Smart Views
The board SHALL provide a view selector with `Todas` (default), `Hoy`, `Vencidas` and `Próximas`. A view SHALL scope the visible tasks as follows, evaluated against the local date and excluding COMPLETED tasks for the time-based views:
- `Hoy`: `dueDate` equals today
- `Vencidas`: `dueDate` is before today
- `Próximas`: `dueDate` is within the next 7 days (today exclusive, +7 inclusive)
- `Todas`: no date scoping

The active view SHALL compose with the tag, priority and search filters, and SHALL be computed over the already-loaded tasks (no additional request). View logic SHALL live in one pure module so it is unit-testable without rendering.

**ID**: REQ-FE-019
**Affected files**:
- `frontend/src/services/boardView.ts` — `BoardView` type + `filterByView(tasks, view, today)` (pure)
- `frontend/src/pages/TodoListPage.tsx` — view selector and composition with existing filters

#### Scenario: Default view shows all tasks
- **WHEN** the user opens `/tasks` without choosing a view
- **THEN** `Todas` is selected and every task is shown (subject to the other filters)

#### Scenario: Today view narrows to tasks due today
- **WHEN** the user selects `Hoy`
- **THEN** only non-completed tasks whose `dueDate` is today remain visible

#### Scenario: Overdue view narrows to past-due tasks
- **WHEN** the user selects `Vencidas`
- **THEN** only non-completed tasks whose `dueDate` is before today remain visible

#### Scenario: Upcoming view narrows to the next 7 days
- **WHEN** the user selects `Próximas`
- **THEN** only non-completed tasks whose `dueDate` is after today and at most 7 days ahead remain visible

#### Scenario: View composes with the other filters
- **WHEN** a view is active and the user also selects a tag or types a search term
- **THEN** the board shows the intersection of the view, the tag filter and the search results

### Requirement: Quick Add Task
Each board column SHALL provide a compact quick-add input that creates a task from a title alone. Submitting SHALL create the task through the repository with the column's status, `priority=LOW` and no tags, and the task SHALL appear in that column without opening the modal. An empty or whitespace-only title SHALL be blocked inline without a request; a backend rejection SHALL surface through the ErrorBanner.

**ID**: REQ-FE-020
**Affected files**:
- `frontend/src/components/QuickAddTask.tsx` — new input + submit handling
- `frontend/src/components/KanbanColumn.tsx` — renders the quick-add with the column status
- `frontend/src/pages/TodoListPage.tsx` — wires quick-add to `repository.create`

#### Scenario: Quick-add creates a task in the column
- **WHEN** the user types a title in a column's quick-add input and presses Enter
- **THEN** a task is created with that column's status, `priority=LOW` and no tags, and appears in the column

#### Scenario: Empty quick-add is blocked inline
- **WHEN** the user submits an empty or whitespace-only title
- **THEN** no request is sent and an inline message is shown

#### Scenario: Quick-add failure is surfaced
- **WHEN** the create request fails
- **THEN** the ErrorBanner shows the contract message and no phantom task is added

### Requirement: Keyboard Board Navigation
Task cards SHALL be keyboard-focusable. When a card has focus, `Alt+ArrowLeft` and `Alt+ArrowRight` SHALL move the task to the previous / next status column (order `PENDING -> ACTIVE -> COMPLETED`), reusing the same move operation and optimistic rollback as drag-and-drop; at the ends of the order the key SHALL be a no-op. `Enter` on a focused card SHALL open the edit modal. The move target logic SHALL live in one pure module so it is unit-testable.

**ID**: REQ-FE-021
**Affected files**:
- `frontend/src/services/boardKeyboard.ts` — `nextStatus(current, direction)` pure
- `frontend/src/components/KanbanCard.tsx` — `tabIndex`, `onKeyDown`, `aria-label`
- `frontend/src/pages/TodoListPage.tsx` — handles the move via the existing status handler

#### Scenario: Move a task forward with the keyboard
- **WHEN** a focused PENDING task receives `Alt+ArrowRight`
- **THEN** its status becomes ACTIVE and the card renders in the ACTIVE column

#### Scenario: Move a task backward with the keyboard
- **WHEN** a focused COMPLETED task receives `Alt+ArrowLeft`
- **THEN** its status becomes ACTIVE

#### Scenario: No-op at the ends of the order
- **WHEN** a focused PENDING task receives `Alt+ArrowLeft`, or a COMPLETED task receives `Alt+ArrowRight`
- **THEN** the status is unchanged and no request is sent

#### Scenario: Keyboard move failure rolls back
- **WHEN** the move request fails
- **THEN** the task returns to its previous column and the transient error banner names the failure

#### Scenario: Enter opens the edit modal
- **WHEN** a focused card receives Enter
- **THEN** the edit modal opens for that task

### Requirement: Dialog Keyboard Accessibility
The task modal SHALL close on `Esc` and SHALL move focus to the title field when it opens, so it is operable without a pointer.

**ID**: REQ-FE-022
**Affected files**:
- `frontend/src/components/AddTaskModal.tsx` — `Esc` handling and initial focus, trailing the existing `role="dialog"`

#### Scenario: Escape closes the modal
- **WHEN** the modal is open and the user presses `Esc`
- **THEN** the modal closes (same as the Cancel/close action)

#### Scenario: Focus starts on the title
- **WHEN** the modal opens
- **THEN** the title input receives focus

### Requirement: Manual Ordering
The board SHALL order each status column by task `position` ascending, breaking ties by `createdAt`, and SHALL let the user reorder tasks by dragging a card to a new position within or across columns. On drop, the page SHALL compute the target position as the midpoint between the new neighbors and call the reorder endpoint optimistically, rolling back and surfacing the error banner on failure.

**ID**: REQ-FE-023
**Affected files**:
- `frontend/src/pages/TodoListPage.tsx` — drag within a column, midpoint computation, optimistic update + rollback
- `frontend/src/components/KanbanColumn.tsx` / `KanbanCard.tsx` — drop targets and index computation
- `frontend/src/data/TaskRepository.ts` — `reorder(id, status, position)`

#### Scenario: Order a column by position
- **WHEN** the board renders a column with tasks at positions 0, 1, 2
- **THEN** the cards appear in that order

#### Scenario: Drag within a column
- **WHEN** the user drags a card between two others in the same column
- **THEN** the card lands between them and its new position is the midpoint of the neighbors

#### Scenario: Reorder failure rolls back
- **WHEN** the reorder request fails
- **THEN** the card returns to its previous position and the error banner names the failure

### Requirement: Undo Task Deletion
After a successful task deletion the board SHALL show a transient "Deshacer" affordance for a short window; activating it SHALL call `TaskRepository.restore(id)` and re-insert the task in its column. Dismissing or waiting out the window SHALL leave the task deleted. A failed restore SHALL surface through the ErrorBanner.

**ID**: REQ-FE-024
**Affected files**:
- `frontend/src/pages/TodoListPage.tsx` — undo affordance + re-insert
- `frontend/src/data/TaskRepository.ts` — `restore(id): Promise<Task>`
- `frontend/src/services/ApiService.ts` — `restoreTask(id)`

#### Scenario: Undo restores the task
- **WHEN** the user deletes a task and activates "Deshacer"
- **THEN** the task reappears in its column

#### Scenario: Window expires
- **WHEN** the user does not activate "Deshacer" before the window ends
- **THEN** the affordance disappears and the task stays deleted

#### Scenario: Restore failure is surfaced
- **WHEN** the restore request fails
- **THEN** the ErrorBanner shows the contract message and the task stays deleted

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

### Requirement: Responsive Board Layout
The board SHALL remain usable from a 360px-wide viewport up to desktop. On narrow viewports the columns SHALL be reachable without horizontal page overflow (horizontal scroll within the board or stacking), the header controls SHALL wrap without overlap, and the task modal SHALL occupy the full viewport. Interactive targets (buttons, cards) SHALL be at least ~40px in their smallest dimension on touch viewports. Breakpoint values SHALL be documented as tokens in `styles/theme.css` and the `@media` literals SHALL match those tokens (CSS cannot use `var()` inside media queries).

**ID**: REQ-FE-026
**Affected files**:
- `frontend/src/styles/theme.css` — breakpoint tokens
- `frontend/src/pages/TodoListPage.module.css` — board + header responsive rules
- `frontend/src/components/KanbanColumn.module.css`, `AddTaskModal.module.css` — column + modal responsive rules
- `frontend/src/components/KanbanCard.module.css` — touch target sizing

#### Scenario: Board fits a phone width
- **WHEN** the app is viewed at 360px wide with several tasks
- **THEN** the columns are reachable (horizontal scroll within the board or stacked) and the page itself does not overflow horizontally

#### Scenario: Header controls wrap
- **WHEN** the viewport is narrow
- **THEN** the header controls wrap onto multiple rows instead of overlapping or clipping

#### Scenario: Modal is full-screen on mobile
- **WHEN** the task modal opens on a narrow viewport
- **THEN** it fills the viewport and its fields remain reachable

#### Scenario: Breakpoints come from tokens
- **WHEN** a component needs a breakpoint
- **THEN** the `@media` value matches the documented token in `styles/theme.css` (literals, since CSS media queries cannot use `var()`)

### Requirement: Paginated Board Loading
The board SHALL load tasks one page at a time through `TaskRepository.fetchPage(query, page, size)`, appending results and offering a "Cargar más" action while more pages remain (using the envelope's `total`). Any change to the query (search/sort/filter) SHALL reset to the first page. Manual ordering and optimistic updates from the current page SHALL keep working.

**ID**: REQ-FE-027
**Affected files**:
- `frontend/src/data/TaskRepository.ts` — `fetchPage(query, page, size): Promise<Page<Task>>` in both adapters
- `frontend/src/services/ApiService.ts` — `getTasks(query, page, size)`
- `frontend/src/pages/TodoListPage.tsx` — page state + "Cargar más"

#### Scenario: Load more appends the next page
- **WHEN** the user has loaded the first page and more remain
- **THEN** "Cargar más" loads and appends the next page without dropping existing tasks

#### Scenario: Query change resets pagination
- **WHEN** the user changes the search, sort or a filter
- **THEN** the board reloads from page 0

#### Scenario: In-memory adapter pages too
- **WHEN** a test calls `fetchPage` on `InMemoryTaskRepository`
- **THEN** it returns the same page/`total` semantics without network

### Requirement: UI Localization
The system SHALL render user-facing strings through a central i18n layer with at least `es` (default) and `en` locales. A language selector SHALL let the user change locale; the choice SHALL persist in `localStorage` and SHALL default to `es` when there is no stored preference (Spanish-first product). Translation keys SHALL be typed so a missing key is a compile-time error. Dates and counts SHALL be formatted with `Intl`.

**ID**: REQ-FE-028
**Affected files**:
- `frontend/src/i18n/index.tsx` — provider + `useT()` + typed `TranslationKey`
- `frontend/src/i18n/es.ts`, `frontend/src/i18n/en.ts` — locale dictionaries
- `frontend/src/App.tsx` — wrap the app in the provider
- `frontend/src/pages/*`, `frontend/src/components/*` — replace literals with `t(...)`

#### Scenario: Default language is Spanish
- **WHEN** the app loads with no stored preference
- **THEN** the UI renders in Spanish

#### Scenario: Switch language
- **WHEN** the user selects English in the selector
- **THEN** the visible strings render in English immediately and the choice persists across reloads

#### Scenario: Missing key is a compile error
- **WHEN** a component uses a key absent from the dictionaries
- **THEN** TypeScript fails the build (no runtime "key not found")

#### Scenario: Dates and counts use Intl
- **WHEN** a due date or count is rendered
- **THEN** it is formatted per the active locale, not by string concatenation

### Requirement: Accessible Status Announcements
The board SHALL announce transient status through a non-interactive polite live region (`role="status"` / `aria-live="polite"`). Any interactive control offered alongside a status message (the "Deshacer" action) SHALL live outside the live region, SHALL receive focus when it appears, and SHALL NOT be removed by the auto-dismiss timer while it retains focus. The board region SHALL expose `aria-busy="true"` while tasks are loading.

**ID**: REQ-FE-029
**Affected files**:
- `frontend/src/pages/TodoListPage.tsx` — separate live announcement, focusable undo button, focus-aware dismiss, `aria-busy`
- `frontend/src/pages/TodoListPage.module.css` — `.srOnly` visually-hidden helper

#### Scenario: Deletion is announced without embedding a control
- **WHEN** the user deletes a task
- **THEN** a polite live region announces the deletion and contains no interactive elements

#### Scenario: Undo button receives focus
- **WHEN** the undo affordance appears after a deletion
- **THEN** focus moves to the "Deshacer" button so it is operable from the keyboard

#### Scenario: Auto-dismiss pauses while focused
- **WHEN** the undo button has focus
- **THEN** the transient affordance is not removed by the timer until focus leaves

#### Scenario: Board reports busy while loading
- **WHEN** the board is loading tasks
- **THEN** the board region exposes `aria-busy="true"`
