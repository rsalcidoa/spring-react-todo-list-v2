# Spec Delta

## ADDED Requirements

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
