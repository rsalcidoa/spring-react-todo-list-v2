# Tag Specification

## Purpose
Provides user-scoped tag creation and assignment to tasks with dropdown-based selection in the task creation and editing interface, enabling hierarchical organization of tasks by category without cross-user visibility.

## Requirements

### Requirement: Tag Entity Uniqueness Per User
The system SHALL enforce uniqueness of tag names within a single user's scope using the normalized identity of a tag: names are trimmed and compared case-insensitively. Enforcement lives at BOTH layers: normalized matching in `TagService` and a database functional unique index on `(user_id, lower(name))` (Flyway `V4__tag_identity_ci`), so concurrent creations of case-variants cannot slip through. The tag module SHALL own contention semantics: `resolve` is idempotent and re-queries fresh on every call, so the task module's single retry loop (one fresh transaction per attempt) reuses raced tags without implementing any tag-specific handling. No method of the tag module SHALL expose the persistence entity: every crossing returns tag values (`id`, `name`) only.

**ID**: REQ-TAG-001
**Affected files**:
- `com.example.todo.service.TagService` — owns tag identity AND retry semantics: per-name case-insensitive lookup, idempotent resolve, duplicate → 409; never returns the entity
- `com.example.todo.repository.TagRepository` — case-insensitive lookup backing the module (no full-list scans)
- `com.example.todo.controller.TagController` — thin delegate to `TagService` (unchanged)
- `db/migration/V4__tag_identity_ci.sql` — functional unique index backstop (unchanged)

#### Scenario: Create unique tag succeeds
- **WHEN** authenticated user sends POST request to `/v1/tags` with `"name": "Work"` in the body
- **THEN** system stores the new tag associated with that user's account and returns 201 Created

#### Scenario: Duplicate tag name rejected for same user
- **WHEN** authenticated user sends POST request to `/v1/tags` with a `"name"` that matches an existing tag they own after trimming and case-insensitive comparison (e.g. `"work"` when `Work` exists)
- **THEN** system rejects the request and returns 409 Conflict

#### Scenario: Concurrent creation of the same tag never fails with 500
- **WHEN** two concurrent requests send POST to `/v1/tags` with the same new tag name for the same user (including case-variants such as `Work` / `work`)
- **THEN** exactly one request returns 201 Created and the other returns 409 Conflict
- **AND** exactly one tag row exists for that normalized name

### Requirement: Tag Assignment on Task Create
**ID**: REQ-TAG-002
The system SHALL accept an optional `tagNames[]` array in POST requests to `/v1/tasks`. When provided, the system resolves each tag name to a user-scoped existing tag or creates it automatically if it does not yet exist for that user. Tag names are normalized (trimmed and case-insensitive) before resolution. Concurrent creation of the same tag reuses it atomically instead of failing. The task and its resolved tags MUST be persisted atomically: if the task cannot be saved, none of the tags resolved for it are left committed. If contention persists beyond retries, the operation SHALL return 409 Conflict — it MUST NOT fail with 500.

**Affected files**:
- `com.example.todo.service.TagService.resolve(User, List<String>)` — per-name case-insensitive lookup + normalized identity, idempotent; returns tag values, never entities
- `com.example.todo.repository.TagRepository.findByUserIdAndNameIgnoreCase` — lookup backing the module (no full-list scans)
- `com.example.todo.service.TaskService.createTask()` — delegates `resolve` to the tag module, attaches by id, and persists task + tags in one transaction; retry exhaustion throws the duplicate-tag failure (409)

#### Scenario: Create task with existing tags
- **WHEN** user sends POST request to `/v1/tasks` with `"tagNames": ["Work", "Urgent"]` and valid task data
- **THEN** system resolves both tag names, assigns them to the new task, and returns 201 Created

#### Scenario: Create task with non-existing tags creates them
- **WHEN** user sends POST request to `/v1/tasks` with `"tagNames": ["NewTag"]` where `NewTag` does not yet exist for that user
- **THEN** system creates the tag, assigns it to the new task, and returns 201 Created

#### Scenario: Tag names are trimmed and case-insensitive
- **WHEN** user sends POST request to `/v1/tasks` with `"tagNames": [" Work "]` where `Work` already exists as a tag for that user
- **THEN** system trims whitespace and matches case-insensitively, assigns the existing `Work` tag (no duplicate created)

#### Scenario: Concurrent creation of the same tag reuses it
- **WHEN** two concurrent requests create tasks with the same new tag name (e.g., `"tagNames": ["NewTag"]`, including case-variants)
- **THEN** both requests succeed with 201 Created and only one tag row exists in the database (the second request reuses the first creation)

#### Scenario: Failed task save leaves no orphan tags
- **WHEN** task persistence fails after tags have been resolved for the request
- **THEN** the operation rolls back and no tag row created for this request is committed

#### Scenario: Persistent contention never fails with 500
- **WHEN** tag contention persists beyond the retry budget while saving a task
- **THEN** system returns 409 Conflict and never 500

### Requirement: Tag Assignment on Task Update
**ID**: REQ-TAG-003
The system SHALL accept an optional `tagNames[]` array in PUT requests to `/v1/tasks/{id}`. The request replaces all tags currently assigned to the task with the specified set; each tag name is resolved from or created into the user's tag scope. Tag names are normalized (trimmed and case-insensitive) before resolution. The update of the task and its tags MUST be persisted atomically: if the task cannot be saved, no tag change is committed.

**Affected files**:
- `com.example.todo.service.TagService.resolve(User, List<String>)` — same normalized `resolve` as create
- `com.example.todo.repository.TagRepository.findByUserId(Long userId)` — batch lookup
- `com.example.todo.service.TaskService.updateTask()` — delegates `resolve` to the tag module and persists task + tags in one transaction

#### Scenario: Replace task tags via update
- **WHEN** user sends PUT request to `/v1/tasks/123` with `"tagNames": ["Personal"]` where the task previously had different tags
- **THEN** system removes all previous tags from the task, assigns "Personal", and returns 200 OK

#### Scenario: Update resolves tag names case-insensitively
- **WHEN** user sends PUT request to `/v1/tasks/123` with `"tagNames": ["work"]` where `Work` already exists for that user
- **THEN** system trims and matches case-insensitively, assigns the existing `Work` tag (no duplicate created)

### Requirement: Tag Response in Task Objects
The system SHALL include a `tags` array (containing tag objects with `id` and `name`) in every response object returned by POST `/v1/tasks`, GET `/v1/tasks/{id}`, PUT `/v1/tasks/{id}`, and the task objects within GET `/v1/tasks`.

#### Scenario: Tag list appears in task responses
- **WHEN** user creates a task with `"tagNames": ["Work"]` via POST to `/v1/tasks`
- **THEN** system returns 201 Created with response JSON containing `"tags": [{"name": "Work"}]`

#### Scenario: Tags appear when retrieving single task
- **WHEN** user sends GET request to `/v1/tasks/{id}` for a task that has multiple tags assigned
- **THEN** the returned object includes all tag names in its `tags` array

### Requirement: Task Tag Response Format
The system SHALL return each tag within a task's `tags` field as an object with at least `name` and optional `id`. The response format must be consistent across all endpoints.

#### Scenario: Tags formatted consistently across API
- **WHEN** user retrieves a tagged task via GET `/v1/tasks/{id}` or POST `/v1/tasks` creation response
- **THEN** the `tags` array contains objects matching `{ "name": string, "id"?: number }` in both endpoints

### Requirement: Tag Deletion Unassigns From Tasks
The system SHALL cascade-delete tag-to-task associations when a tag is deleted. Removing a tag does not delete associated tasks; it only removes the tag reference from each task's `tags` list.

#### Scenario: Delete tag unassigns from all tasks
- **WHEN** user sends DELETE request to `/v1/tags/{id}` for a tag currently assigned to one or more tasks
- **THEN** system deletes the tag and removes its association from every affected task
- **AND** the tasks themselves remain unchanged except the removed tag

### Requirement: List User Tags
The system SHALL allow authenticated users to retrieve their own tags via a GET request to `/v1/tags`, returning an array of tag objects sorted alphabetically by name. Each tag object MUST contain exactly `id` and `name`; the response MUST NOT expose any other field of the tag entity (no `user` object, no `tasks` collection).

**ID**: REQ-TAG-004
**Affected files**:
- `com.example.todo.controller.TagController.getAllTags()` — delegates to `TagService.list`
- `com.example.todo.service.TagService.list(User)` — returns `TagResponse` objects, never the entity

#### Scenario: Successful tag listing
- **WHEN** authenticated user sends GET request to `/v1/tags`
- **THEN** system returns 200 OK with an array of the user's tags, each containing `id` and `name`, sorted alphabetically

#### Scenario: Tag listing does not expose entity internals
- **WHEN** authenticated user sends GET request to `/v1/tags`
- **THEN** no element of the response array contains a `user` field (no password hash, no email) nor any field other than `id` and `name`

### Requirement: Create User Tag
The system SHALL allow authenticated users to create a new tag for their own account via POST request to `/v1/tags`. The name field is required, must be 1–50 characters, and must not match — after trimming and case-insensitive comparison — an existing tag owned by the same user. The stored name is the trimmed input, keeping the case of the first creation. Invalid names are rejected with 400 Bad Request with field-level details; a duplicate by normalized identity is rejected with 409 Conflict; a concurrent creation of the same tag MUST NOT fail with 500.

**ID**: REQ-TAG-005
**Affected files**:
- `com.example.todo.dto.TagRequest` — new DTO, `name` with `@NotBlank` + `@Size(min=1, max=50)`
- `com.example.todo.controller.TagController.createTag()` — delegates to `TagService.create`
- `com.example.todo.service.TagService.create(User, String)` — normalization + race-safe create-or-reuse
- `com.example.todo.exception.GlobalExceptionHandler` — maps invalid-name failure to 400 field-level and duplicate to 409

#### Scenario: Successful tag creation
- **WHEN** authenticated user sends POST request to `/v1/tags` with `"name": "Personal"` (unique for that user)
- **THEN** system stores the new tag associated with the user's account and returns 201 Created with body containing `id` and `name`

#### Scenario: Tag name is trimmed before storage
- **WHEN** authenticated user sends POST request to `/v1/tags` with `"name": " Personal "`
- **THEN** system returns 201 Created and stores the tag with name `Personal`

#### Scenario: Case-insensitive duplicate rejected
- **WHEN** tag `Work` exists for the user and the user sends POST request to `/v1/tags` with `"name": "work"`
- **THEN** system returns 409 Conflict and creates no new tag row

#### Scenario: Concurrent creation of the same tag
- **WHEN** two concurrent requests send POST to `/v1/tags` with the same new tag name for the same user
- **THEN** one request returns 201 Created, the other returns 409 Conflict, and exactly one tag row exists

#### Scenario: Blank or oversized name rejected
- **WHEN** authenticated user sends POST request to `/v1/tags` with `"name": ""` or a name longer than 50 characters
- **THEN** system returns 400 Bad Request with field-level details `{"error":"Validation failed","errors":{"name":[...]}}`

### Requirement: Delete User Tag
**ID**: REQ-DUT-001
The system SHALL allow authenticated users to delete their own tags via DELETE request to `/v1/tags/{id}`. The tag must belong to the requesting user; attempting to delete another user's tag returns 403 Forbidden; deleting a tag id that does not exist returns 404 Not Found.

**Affected files**: `com.example.todo.controller.TagController.deleteTag()` — ownership decidido a través de `com.example.todo.security.CurrentUserProvider`; `com.example.todo.exception.GlobalExceptionHandler` — mapeo 403/404.

#### Scenario: Successful tag deletion
- **WHEN** authenticated user sends DELETE request to `/v1/tags/5` for a tag they own
- **THEN** system deletes the tag, unassigns it from all associated tasks, and returns 204 No Content

#### Scenario: Delete another user's tag forbidden
- **WHEN** unauthenticated or different authenticated user sends DELETE request to `/v1/tags/5` for a tag owned by someone else
- **THEN** system returns 403 Forbidden

#### Scenario: Delete of a non-existent tag returns 404
- **WHEN** authenticated user sends DELETE request to `/v1/tags/9999` for an id that does not exist
- **THEN** system returns 404 Not Found

### Requirement: Tag Ownership Enforcement
**ID**: REQ-TOE-001
The system SHALL only allow the owning user to create, list, update, or delete tags. Every tag operation must verify that the authenticated user is the tag owner before processing. The ownership verification is centralized in the same current-user seam used by tasks, so tag and task ownership decisions cannot drift apart.

**Affected files**: `com.example.todo.security.CurrentUserProvider` — nuevo; `com.example.todo.controller.TagController` — usa la seam para la verificación de ownership.

#### Scenario: Unauthorized user cannot access another's tags
- **WHEN** user A attempts GET `/v1/tags` after authenticating as user B via token
- **THEN** system returns only tags owned by user B, not user A (or returns 403 if the API is scoped per-user)

### Requirement: Tag Management from Modal UI
The system SHALL allow authenticated users to create and delete tags directly from the task creation/editing modal interface. Tag creation and deletion SHALL NOT require navigating to a separate management page.

**ID**: REQ-TAG-006
**Affected files**:
- `frontend/src/components/AddTaskModal.tsx` — input for new tag creation, delete button on existing tag pills
- `frontend/src/components/AddTaskModal.module.css` — styles for `.tagInput`, `.tagCreateBtn`, `.tagDeleteBtn`
- `frontend/src/pages/TodoListPage.tsx` — trigger `loadTags()` after tag create/delete operations
- `frontend/src/services/ApiService.ts` — `createTag()` and `deleteTag()` endpoints already exist

#### Scenario: User creates and assigns a new tag to a task
- **WHEN** user types a tag name in the new tag input, clicks "Create", then clicks the new tag pill
- **THEN** the tag is created via `POST /v1/tags` and assigned to the task via the existing tagNames flow
- **AND** the tag appears in the tag pills list after automatic refresh

#### Scenario: User deletes a tag that is not assigned to any task
- **WHEN** user clicks the delete button (×) on a tag pill
- **THEN** the tag is deleted via `DELETE /v1/tags/{id}`
- **AND** the tag is removed from the list and unassigned from all associated tasks

#### Scenario: User deletes a tag that is assigned to a task
- **WHEN** user clicks the delete button (×) on a tag pill that is assigned to existing tasks
- **THEN** the tag is deleted and unassigned from all associated tasks
- **AND** the tasks remain intact without the deleted tag
