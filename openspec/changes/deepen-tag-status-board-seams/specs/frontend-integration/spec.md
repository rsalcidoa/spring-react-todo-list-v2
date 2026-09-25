# Spec Delta — frontend-integration

## ADDED Requirements

### Requirement: Board Task Repository Operations
The frontend task data layer SHALL expose board operations through the `TaskRepository` interface with domain types: `fetchAll(): Promise<Task[]>`, `create(input: TaskInput): Promise<Task>`, `update(id: number, input: TaskInput): Promise<void>`, `move(id: number, status: TaskStatus): Promise<void>`, `remove(id: number): Promise<void>`, `listTags(): Promise<Tag[]>`. `TaskInput` is a domain input type (`title`, `description?`, `priority`, `status`, `dueDate?`, `tagNames: string[]`) defined in `frontend/src/services/types/task.ts`. The wire format (`tagNames` on task mutation requests) MUST be owned exclusively by the repository adapters, which convert between domain input and wire request, and between wire response and domain `Task`, in both directions. The frontend SHALL provide at least two adapters over the same interface: `HttpTaskRepository` (over `ApiService`) and `InMemoryTaskRepository` (in-memory state, no network). No `any` cast may hide the domain↔wire conversion: a domain input carrying tag names MUST produce a wire request whose `tagNames` matches those names, and a caller passing a full domain `Task` (with `tags: Tag[]`) where a `TaskInput` is expected MUST be rejected at compile time.

**ID**: REQ-FE-009
**Affected files**:
- `frontend/src/data/TaskRepository.ts` — deep interface + `HttpTaskRepository` (owns domain↔wire conversion) + `InMemoryTaskRepository`
- `frontend/src/services/types/task.ts` — `TaskInput` type
- `frontend/src/services/ApiService.ts` — `updateTask` accepts a typed input instead of `any`
- `frontend/src/pages/TodoListPage.tsx` — handlers use `TaskInput` (no `as any`)
- `frontend/src/components/AddTaskModal.tsx` — `onSave` receives `TaskInput` (no `any`)

#### Scenario: Domain input with tag names reaches the wire
- **WHEN** a caller invokes `create(input)` with `input.tagNames = ["Work", "Personal"]`
- **THEN** the wire request body sent to `/v1/tasks` contains `"tagNames": ["Work", "Personal"]`
- **AND** the task is stored with exactly those tags (no silent tag loss)

#### Scenario: Wire task responses map to the domain type
- **WHEN** `fetchAll()` receives wire task objects with `tags: [{id, name}]`
- **THEN** the returned `Task[]` contains, per task, a `tags: Tag[]` array with `id` and `name` per tag and a status value among `PENDING`, `ACTIVE`, `COMPLETED`

#### Scenario: move transitions a task status
- **WHEN** a caller invokes `move(id, "COMPLETED")`
- **THEN** the task's status becomes `COMPLETED` (in `HttpTaskRepository`: PATCH `/v1/tasks/{id}/status` with `{"status": "COMPLETED"}`; in `InMemoryTaskRepository`: the stored task is updated)

#### Scenario: remove deletes a task
- **WHEN** a caller invokes `remove(id)`
- **THEN** the task is no longer returned by `fetchAll()` (in `HttpTaskRepository`: DELETE `/v1/tasks/{id}`; in `InMemoryTaskRepository`: the stored task is removed)

#### Scenario: In-memory adapter implements the full interface without network
- **WHEN** a test drives the full board flow — `fetchAll`, `create`, `update`, `move`, `remove`, `listTags` — against `InMemoryTaskRepository`
- **THEN** every operation completes with correct in-memory state and zero network requests

## MODIFIED Requirements

### Requirement: Delete Task Functionality
The system SHALL allow users to delete tasks. The frontend SHALL extract task data operations into a `TaskRepository` module that owns the board operations `fetchAll`, `create`, `update`, `move`, `remove`, and `listTags` (see `Board Task Repository Operations`).

**Affected files**:
- `frontend/src/components/KanbanCard.tsx` — delete button (`onDelete?: () => void` prop; renders a delete icon/button in the card header)
- `frontend/src/components/KanbanColumn.tsx` — pass `onDelete` to each `KanbanCard`
- `frontend/src/pages/TodoListPage.tsx` — wire `handleDelete` to the repository's `remove()` method; refresh tags after create/update
- `frontend/src/data/TaskRepository.ts` — module (interface + `HttpTaskRepository` over ApiService + `InMemoryTaskRepository`); `remove(id)` (renamed from `delete`) and `move(id, status)` (renamed from `patchStatus`)

#### Scenario: User Deletes Task
- **WHEN** user clicks delete button on a task
- **THEN** system removes task from list and shows confirmation (via `window.confirm`)
- **AND** the delete operation goes through `TaskRepository.remove(id)`
