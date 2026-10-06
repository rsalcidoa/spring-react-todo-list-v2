# Spec Delta

## ADDED Requirements

### Requirement: Undo Task Deletion
After a successful task deletion the board SHALL show a transient "Deshacer" affordance for a short window; activating it SHALL call `TaskRepository.restore(id)` and re-insert the task in its column. Dismissing or waiting out the window SHALL leave the task deleted. A failed restore SHALL surface through the ErrorBanner.

**ID**: REQ-FE-024
**Affected files**:
- `frontend/src/pages/TodoListPage.tsx` — undo affordance + re-insert
- `frontend/src/data/TaskRepository.ts` — `restore(id): Promise<Task>`
- `frontend/src/services/ApiService.ts` — `restoreTask(id)`

#### Scenario: Undo restores the task
- **WHEN** the user deletes a task and activates "Deshacer"
- **THEN** the task reappears in its column

#### Scenario: Window expires
- **WHEN** the user does not activate "Deshacer" before the window ends
- **THEN** the affordance disappears and the task stays deleted

#### Scenario: Restore failure is surfaced
- **WHEN** the restore request fails
- **THEN** the ErrorBanner shows the contract message and the task stays deleted
