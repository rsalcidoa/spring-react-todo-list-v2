# Proposal — Manage projects from the board

## Why

Projects can only be created through the API; the UI shows a project filter and
a project picker in the task modal but no way to create one. Users need to
create projects (with an optional description), edit them and delete them.

## What Changes

- Add a **Manage projects** dialog: list of projects with create/edit
  (name 1–50 + optional description ≤500) and delete (confirm; tasks become
  unassigned).
- Entry points: a **Create project** action in the empty board state (when there
  are no tasks and no projects) and a **＋ New project…** option in the project
  selector.
- The **task modal only selects** an existing project (no creation there).
- Carry `description` through the frontend `Project` type, `ProjectStore`,
  `ApiService` and the in-memory adapter.

**Non-goals:** the board scope behavior (separate change); project colors/icons.

**Rollback plan:** revert the dialog, entry points and type changes. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds "Project Management".

## Impact

- **Frontend (TS):** new `components/ManageProjectsModal.tsx` (+ css),
  `services/types/task.ts` (`Project.description`), `data/TaskRepository.ts`
  (`ProjectStore`, `InMemoryTaskRepository`), `services/ApiService.ts`,
  `pages/TodoListPage.tsx` / `useBoard.ts`, tests, contract suite, baselines.
