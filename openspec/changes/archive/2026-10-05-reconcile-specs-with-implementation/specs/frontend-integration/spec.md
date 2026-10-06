# Spec Delta

## MODIFIED Requirements

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
