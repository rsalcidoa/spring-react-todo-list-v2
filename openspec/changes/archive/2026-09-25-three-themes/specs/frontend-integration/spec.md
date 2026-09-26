# Spec Delta — frontend-integration (selector de temas)

## MODIFIED Requirements

### Requirement: Task List View
The system SHALL display all tasks grouped by status with per-column counts (tabular numerals) and a board total, entirely in Spanish UI copy. The board header SHALL include a theme selector (Ink Pipeline default, Phosphor, Nord Frost) persisted in `localStorage`; the chosen theme SHALL restyle board, modal, auth pages and banners through the token contract with zero logic changes.

#### Scenario: User switches theme and it persists
- **WHEN** user picks Phosphor in the header selector and reloads
- **THEN** the UI renders the Phosphor skin on every page (board, modal, auth, toasts)

#### Scenario: No theme attribute means default styling intact
- **WHEN** `data-theme` is absent
- **THEN** base styles render exactly as before the theme change

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
