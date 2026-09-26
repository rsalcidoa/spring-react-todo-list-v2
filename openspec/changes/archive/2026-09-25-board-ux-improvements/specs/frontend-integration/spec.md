# Spec Delta — frontend-integration (board UX)

## MODIFIED Requirements

### Requirement: Task List View
The system SHALL display all tasks grouped by status with per-column counts (tabular numerals) and a board total. Each task SHALL show its due-state derived from `dueDate` against the local date: `overdue` (past), `today`, `future`, or `none` (no date). A tag filter in the board header SHALL narrow visible tasks to those carrying any selected tag. Loading SHALL show skeletons; empty columns and empty boards SHALL show actionable empty states (with a create CTA). Failed moves SHALL surface a visible confirmation/rollback notice beyond the transient banner.

#### Scenario: User Views Task List
- **WHEN** user navigates to /tasks page
- **THEN** system displays all user's tasks in a scrollable list

#### Scenario: User sees counts and due-states at a glance
- **WHEN** user opens `/tasks` with tasks across statuses and dates
- **THEN** each column shows its count, the header shows the total, overdue tasks carry the `overdue` treatment, today's the `today` treatment, and dateless tasks show no due chip

#### Scenario: User filters by tag
- **WHEN** user selects one or more tags in the header filter
- **THEN** only tasks carrying any selected tag are shown; clearing restores all

#### Scenario: Drop target is visible and failure is explained
- **WHEN** user drags a task over a column
- **THEN** the column highlights as a valid target; on failed `move` the task visibly rolls back with an explanatory notice

#### Scenario: Loading and empty states guide
- **WHEN** tasks/tags are loading
- **THEN** skeletons occupy the board; WHEN the board or a column is empty THEN an empty state with a create CTA is shown

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

### Requirement: Frontend Password Reset Pages
The system SHALL expose two new routes: `/forgot-password` for requesting a reset token, and `/reset/:token` for verifying the token and changing the password. The token display SHALL include a one-click copy action with confirmation. Errors SHALL carry an action (retry the request, or follow the existing "request a new code" link).

#### Scenario: User copies the reset token
- **WHEN** the token is displayed
- **THEN** a copy action places it on the clipboard and confirms

#### Scenario: Reset errors direct action
- **WHEN** reset fails for an expired token or a request error
- **THEN** the message names the fix (request a new code / retry) instead of only describing the failure

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
