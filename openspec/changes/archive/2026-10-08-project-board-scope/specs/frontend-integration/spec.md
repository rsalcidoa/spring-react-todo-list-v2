# Spec Delta

## ADDED Requirements

### Requirement: Project Board Scope
The board SHALL scope the visible tasks by project through a selector with:
**Todos** (default — every task), **Sin proyecto** (tasks with no project),
each of the user's projects, and a "New project…" entry. The header title SHALL
reflect the active scope ("Todas las tareas", "Sin proyecto" or the project
name); when a project is selected, its description SHALL appear as a muted
subtitle. Creating a project SHALL select it, and the task modal SHALL
preselect the active project for new tasks.

**ID**: REQ-FE-037
**Affected files**:
- `frontend/src/pages/TodoListPage.tsx` — scope switcher and scope title/subtitle
- `frontend/src/pages/useBoard.ts` / `frontend/src/services/boardQuery.ts` — `'none'` vs unset vs id
- `frontend/src/components/AddTaskModal.tsx` / `useTaskForm.ts` — preselect the active project

#### Scenario: Default scope shows everything
- **WHEN** the board opens without a chosen project
- **THEN** the scope is `Todos` and every task is shown

#### Scenario: Scope to a project
- **WHEN** the user selects a project in the scope selector
- **THEN** only that project's tasks are shown, and the title shows the project name with its description as a subtitle

#### Scenario: Scope to tasks without a project
- **WHEN** the user selects `Sin proyecto`
- **THEN** only tasks with no project are shown

#### Scenario: Creating a project selects it
- **WHEN** the user creates a project
- **THEN** the scope switches to it and the board shows its (empty) columns

#### Scenario: New tasks preselect the active project
- **WHEN** a project is the active scope and the user opens the new-task modal
- **THEN** that project is preselected in the modal
