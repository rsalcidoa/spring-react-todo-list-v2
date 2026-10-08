# Proposal — Scope the board by project

## Why

Today one aggregated board shows tasks from every project and unassigned tasks;
the project control is a minor filter. With projects as first-class containers,
the board should be scoped to the selected project, and the header title should
say what you are looking at instead of a static "Tablero".

## What Changes

- The project control becomes a **scope switcher** with **Todos** (default),
  **Sin proyecto** (tasks with no project), each project, and **＋ Nuevo
  proyecto…**.
- The board shows only the selected scope.
- The header title becomes a **scope title**: "Todas las tareas", "Sin proyecto"
  or the project name, with the project **description** as a muted subtitle
  (replacing the static "Tablero" heading).
- Creating a project selects it; the task modal preselects the active project.

**Non-goals:** swimlanes; changing the project CRUD (separate change).

**Rollback plan:** revert the frontend files; the project control returns to a
simple filter and the title to "Tablero". Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds "Project Board Scope".

## Impact

- **Frontend (TS):** `pages/TodoListPage.tsx` (+ `.module.css`), `pages/useBoard.ts`,
  `services/boardQuery.ts`, `components/AddTaskModal.tsx` / `useTaskForm.ts`,
  `i18n/{es,en}.ts`, tests, visual baselines.
