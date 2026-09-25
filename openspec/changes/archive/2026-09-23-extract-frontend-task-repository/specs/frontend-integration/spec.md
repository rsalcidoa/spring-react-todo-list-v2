# Spec Delta — frontend-integration

## MODIFIED Requirements

### Requirement: Delete Task Functionality

The system SHALL allow users to delete tasks. The frontend SHALL extract task data operations into a `TaskRepository` module that owns fetch, create, update, delete, patchStatus, and tag management.

**Affected files**: 
- `frontend/src/components/KanbanCard.tsx` — add delete button (`onDelete?: () => void` prop; renders a delete icon/button in the card header)
- `frontend/src/components/KanbanColumn.tsx` — pass `onDelete` to each `KanbanCard`
- `frontend/src/pages/TodoListPage.tsx` — wire `handleDelete` to the repository's `delete()` method; refresh tags after create/update
- `frontend/src/data/TaskRepository.ts` — new module (interface + `HttpTaskRepository` over ApiService)

#### Scenario: User Deletes Task
- **WHEN** user clicks delete button on a task
- **THEN** system removes task from list and shows confirmation (via `window.confirm`)
- **AND** the delete operation goes through `TaskRepository.delete(id)`

## ADDED Requirements

### Requirement: Tag List Refresh

The system SHALL refresh the available tags list in the task board after a successful task creation or update that may have introduced new tags, so the user sees the new tags immediately without a page reload.

**ID**: REQ-FE-008
**Affected files**: 
- `frontend/src/pages/TodoListPage.tsx` — after `createTask` or `updateTask` success, call `repository.refreshTags()` to update tags state
- `frontend/src/data/TaskRepository.ts` — `refreshTags()` method (fetch tags via ApiService + update internal state)
- `frontend/src/components/AddTaskModal.tsx` — receives updated `existingTags` prop

#### Scenario: New tag appears after task creation without reload
- **WHEN** user creates a task with a new tag name via the `AddTaskModal`
- **THEN** the board refreshes the tags list and the new tag appears in the dropdown of `AddTaskModal` without requiring a page reload
