# Spec Delta

## ADDED Requirements

### Requirement: Client-side Email Validation
The system SHALL validate email format on the frontend before submitting login or registration requests, using a regex pattern that checks for `localpart@domain.tld` structure. Invalid format SHALL display an inline error message via the ErrorBanner component and prevent form submission.

**Affected files**:
- `frontend/src/pages/LoginPage.tsx` — `validateEmail()` helper, check before `login()` call
- `frontend/src/pages/RegisterPage.tsx` — `validateEmail()` helper, check before `registerUser()` call

#### Scenario: Valid email passes frontend validation
- **WHEN** user enters `usuario@dominio.com` in the login or register email field
- **THEN** the regex check passes and the form submits to the backend

#### Scenario: Invalid email blocked before submission
- **WHEN** user enters `mail@mail` or `notanemail` in the email field
- **THEN** the frontend validation fails and an ErrorBanner is displayed with message "Invalid email format"
- **AND** the form does not submit to the backend

#### Scenario: Empty email blocked by HTML5 required
- **WHEN** user submits the form with an empty email field
- **THEN** the HTML5 `required` attribute blocks submission

### Requirement: ErrorBanner Toast Component
The system SHALL provide a shared `ErrorBanner` component that displays error messages as a floating toast in the upper-right corner of the viewport. The banner SHALL auto-hide after 5 seconds, stack vertically when multiple errors occur simultaneously, and use CSS custom property `--color-danger` for text color.

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

#### Scenario: Multiple errors stack vertically
- **WHEN** two errors occur within 5 seconds of each other
- **THEN** both banners are visible, stacked vertically

#### Scenario: ErrorBanner replaces alert() dialogs
- **WHEN** registration fails with 409 Conflict
- **THEN** ErrorBanner displays the error message instead of a browser `alert()`

### Requirement: Status Default PENDING in Task Creation
The system SHALL display the status field pre-selected to `PENDING` and disabled when creating a new task in the `AddTaskModal`. When editing an existing task, the status field SHALL be enabled and editable.

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
The system SHALL allow authenticated users to create new tags directly from the `AddTaskModal` via an input field and a "Create" button. Upon successful creation, the tag SHALL be immediately added to the available tags list via `loadTags()` refresh without page reload.

**Affected files**:
- `frontend/src/components/AddTaskModal.tsx` — new tag input, create button, `createTag()` call
- `frontend/src/components/AddTaskModal.module.css` — styles for new tag input
- `frontend/src/pages/TodoListPage.tsx` — pass `onTagCreated` callback or rely on existing `loadTags()` refresh
- `frontend/src/services/ApiService.ts` — `createTag()` already exists

#### Scenario: User creates a new tag from the modal
- **WHEN** user types a tag name (1-50 chars) in the new tag input and clicks "Create"
- **THEN** the system calls `POST /v1/tags` with the tag name
- **AND** the new tag appears in the tag pills list after `loadTags()` refresh

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
