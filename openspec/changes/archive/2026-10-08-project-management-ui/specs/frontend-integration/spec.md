# Spec Delta

## ADDED Requirements

### Requirement: Project Management
The board SHALL let the user create, edit and delete their projects. An empty
board with no projects SHALL offer a "Create project" action, and the project
selector SHALL offer a "New project…" entry. A single "Manage projects" dialog
SHALL list the projects and provide a form to create/edit a project (name 1–50
characters and an optional description up to 500 characters) and to delete a
project with confirmation; deleting a project SHALL leave its tasks intact but
unassigned. The task modal SHALL only select an existing project, not create
one.

**ID**: REQ-FE-036
**Affected files**:
- `frontend/src/components/ManageProjectsModal.tsx` — the dialog
- `frontend/src/pages/TodoListPage.tsx` / `useBoard.ts` — entry points and actions
- `frontend/src/data/TaskRepository.ts` — `ProjectStore` with `description`
- `frontend/src/services/types/task.ts` — `Project.description`

#### Scenario: Create a project with a description
- **WHEN** the user opens Manage projects and creates "Casa" with a description
- **THEN** the project appears in the list and in the project selector with its description

#### Scenario: Edit a project
- **WHEN** the user edits a project's name or description and saves
- **THEN** the change is persisted and reflected in the selector

#### Scenario: Delete a project unassigns its tasks
- **WHEN** the user deletes a project that has tasks
- **THEN** the projects are removed and the tasks remain, without a project

#### Scenario: Empty board offers project creation
- **WHEN** the board has no tasks and no projects
- **THEN** the empty state offers a "Create project" action
