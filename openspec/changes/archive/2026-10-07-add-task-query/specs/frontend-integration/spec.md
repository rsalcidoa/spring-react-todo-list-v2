# Spec Delta

## MODIFIED Requirements

### Requirement: Task List View
The system SHALL display all tasks grouped by status with per-column counts (tabular numerals) and a board total. Each task SHALL show its due-state derived from `dueDate` against the local date: `overdue` (past), `today`, `future`, or `none` (no date). The board header SHALL provide a debounced search box (title/description), a sort control (field `createdAt|dueDate|priority|title` and direction `asc|desc`), a priority filter, and the existing tag filter; these controls SHALL narrow/order the visible tasks through the repository query. Loading SHALL show skeletons; an empty board SHALL show an actionable empty state (with a create CTA) while empty columns show a plain "Sin tareas" text. Failed moves SHALL roll back visibly and surface the failure through the transient error banner.

#### Scenario: User Views Task List
- **WHEN** user navigates to /tasks page
- **THEN** system displays the user's tasks grouped into status columns on the Kanban board

#### Scenario: User sees counts and due-states at a glance
- **WHEN** user opens `/tasks` with tasks across statuses and dates
- **THEN** each column shows its count, the header shows the total, overdue tasks carry the `overdue` treatment, today's the `today` treatment, and dateless tasks show no due chip

#### Scenario: User searches tasks
- **WHEN** user types "informe" in the search box
- **THEN** only tasks whose title or description contains "informe" (case-insensitive) remain on the board, and clearing the box restores all tasks

#### Scenario: User sorts the board
- **WHEN** user selects sort `dueDate` ascending
- **THEN** tasks within each column are ordered by dueDate ascending, dateless tasks last

#### Scenario: User filters by priority
- **WHEN** user selects priority `HIGH`
- **THEN** only HIGH-priority tasks remain visible; clearing restores all

#### Scenario: User filters by tag
- **WHEN** user selects one or more tags in the header filter
- **THEN** only tasks carrying any selected tag are shown; clearing restores all

#### Scenario: Drop target is visible and failure is explained
- **WHEN** user drags a task over a column
- **THEN** the column highlights as a valid target; on failed `move` the task visibly rolls back and the transient error banner names the failure

#### Scenario: Loading and empty states guide
- **WHEN** tasks/tags are loading
- **THEN** skeletons occupy the board; WHEN the board is empty THEN an empty state with a create CTA is shown, and WHEN a column is empty it shows a plain "Sin tareas" text

### Requirement: Board Task Repository Operations
The frontend task data layer SHALL expose board operations through the `TaskRepository` interface with domain types: `fetchAll(query?: TaskQuery): Promise<Task[]>`, `create(input: TaskInput): Promise<Task>`, `update(id: number, input: TaskInput): Promise<Task>`, `move(id: number, status: TaskStatus): Promise<void>`, `remove(id: number): Promise<void>`, `listTags(): Promise<Tag[]>`, `createTag(name: string): Promise<Tag>`, `deleteTag(id: number): Promise<void>`. `update` SHALL return the updated `Task` so callers do not patch local state by hand. `createTag` SHALL return the backend tag with its real id (no client-generated ids). `fetchAll` SHALL accept an optional domain `TaskQuery` (`q`, `priority`, `tagIds`, `sort`, `dir`, `status`) and the HTTP adapter SHALL own its wire encoding; the in-memory adapter SHALL apply the same semantics. The wire format MUST be owned exclusively by the repository adapters. Both adapters (`HttpTaskRepository`, `InMemoryTaskRepository`) SHALL share semantics: tag identity trimmed and case-insensitive, and operations on missing ids SHALL reject (no silent no-ops). Error mapping SHALL be shared: one interpretation of the HTTP contract used by page and modal alike. No `any` cast may hide the domain<->wire conversion.

**ID**: REQ-FE-009
**Affected files**:
- `frontend/src/data/TaskRepository.ts` — deep interface + `HttpTaskRepository` (owns domain<->wire conversion) + `InMemoryTaskRepository`
- `frontend/src/services/types/task.ts` — `TaskInput` and `TaskQuery` types
- `frontend/src/services/ApiService.ts` — `getTasks(query?)` forwards query params
- `frontend/src/pages/TodoListPage.tsx` — owns the query state, passes it to `fetchAll`
- `frontend/src/components/AddTaskModal.tsx` — `onSave` receives `TaskInput` (no `any`)

#### Scenario: Domain input with tag names reaches the wire
- **WHEN** a caller invokes `create(input)` with `input.tagNames = ["Work", "Personal"]`
- **THEN** the wire request body sent to `/v1/tasks` contains `"tagNames": ["Work", "Personal"]`
- **AND** the task is stored with exactly those tags (no silent tag loss)

#### Scenario: Query reaches the wire
- **WHEN** a caller invokes `fetchAll({ q: "informe", priority: "HIGH", sort: "dueDate", dir: "asc" })`
- **THEN** the HTTP adapter issues `GET /v1/tasks` with `q=informe`, `priority=HIGH`, `sort=dueDate` and `dir=asc` as query parameters
- **AND** the in-memory adapter returns the same filtered/ordered result without a network call

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
