# Spec Delta — frontend-integration (board module)

## MODIFIED Requirements

### Requirement: Board Task Repository Operations
The frontend task data layer SHALL expose board operations through the `TaskRepository` interface with domain types: `fetchAll(): Promise<Task[]>`, `create(input: TaskInput): Promise<Task>`, `update(id: number, input: TaskInput): Promise<Task>`, `move(id: number, status: TaskStatus): Promise<void>`, `remove(id: number): Promise<void>`, `listTags(): Promise<Tag[]>`, `createTag(name: string): Promise<Tag>`, `deleteTag(id: number): Promise<void>`. `update` SHALL return the updated `Task` so callers do not patch local state by hand. `createTag` SHALL return the backend tag with its real id (no client-generated ids). The wire format MUST be owned exclusively by the repository adapters. Both adapters (`HttpTaskRepository`, `InMemoryTaskRepository`) SHALL share semantics: tag identity trimmed and case-insensitive, and operations on missing ids SHALL reject (no silent no-ops). No `any` cast may hide the domain↔wire conversion.

**ID**: REQ-FE-009
**Affected files**:
- `frontend/src/data/TaskRepository.ts` — extended interface + both adapters
- `frontend/src/services/types/task.ts` — `TaskInput` type (unchanged)
- `frontend/src/services/ApiService.ts` — typed tag endpoints reused by the adapter
- `frontend/src/pages/TodoListPage.tsx` — view state only; uses returned `Task`
- `frontend/src/components/AddTaskModal.tsx` — `onSave` receives `TaskInput`; tag ops via repository (no direct `ApiService` import, no fabricated ids)

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
- **AND** a failed `move` rejects so the caller can roll back optimistic state

#### Scenario: remove deletes a task
- **WHEN** a caller invokes `remove(id)` with confirmation from the caller
- **THEN** the task is no longer returned by `fetchAll()` (in `HttpTaskRepository`: DELETE `/v1/tasks/{id}`; in `InMemoryTaskRepository`: the stored task is removed)

#### Scenario: In-memory adapter implements the full interface without network
- **WHEN** a test drives the full board flow — `fetchAll`, `create`, `update`, `move`, `remove`, `listTags`, `createTag`, `deleteTag` — against `InMemoryTaskRepository`
- **THEN** every operation completes with correct in-memory state and zero network requests

#### Scenario: Created tag carries the real id
- **WHEN** a caller invokes `createTag("Work")`
- **THEN** the returned `Tag` carries the backend-assigned `id` (never a client-fabricated one)
- **AND** the tag appears in `listTags()` without a manual refresh hack

#### Scenario: Shared error mapping
- **WHEN** any repository operation fails with `409`, `400` or `404`
- **THEN** the caller receives the contract message through one shared mapping used by page and modal alike

### Requirement: Tag Creation from Modal
The system SHALL allow authenticated users to create new tags directly from the `AddTaskModal` via an input field and a "Create" button. Creation SHALL go through `TaskRepository.createTag()` and use the returned real `id`; the tag SHALL be immediately added to the available tags list without page reload.

**ID**: REQ-FE-013
**Affected files**:
- `frontend/src/components/AddTaskModal.tsx` — new tag input, create button, repository call (no direct `ApiService` import)
- `frontend/src/pages/TodoListPage.tsx` — refresh via repository state

#### Scenario: User creates a new tag from the modal
- **WHEN** user types a tag name (1-50 chars) in the new tag input and clicks "Create"
- **THEN** the system creates the tag via the repository and it appears in the tag pills list with its real id
- **AND** no client-fabricated id ever reaches task reconciliation

#### Scenario: Duplicate tag creation is rejected
- **WHEN** user attempts to create a tag that already exists for the user
- **THEN** the system returns 409 Conflict
- **AND** the shared error mapping displays the duplicate message

#### Scenario: Blank tag name is rejected
- **WHEN** user clicks "Create" with an empty or whitespace-only input
- **THEN** the backend returns 400 Bad Request
- **AND** the shared error mapping displays the validation error
