# Spec Delta — tagging

## MODIFIED Requirements

### Requirement: Tag Entity Uniqueness Per User
The system SHALL enforce uniqueness of tag names within a single user's scope using the normalized identity of a tag: names are trimmed and compared case-insensitively. Each user may create tags with distinct normalized names; tag names are scoped per user so two users can have tags with the same name independently. A duplicate by normalized identity for the same user is rejected with 409 Conflict. A concurrent creation of the same tag reuses the existing tag or returns 409 — it MUST NOT fail with 500.

**ID**: REQ-TAG-001
**Affected files**:
- `com.example.todo.service.TagService` — owns tag identity: normalized matching (trim + case-insensitive), create-or-reuse with retry on concurrent creation, duplicate → 409
- `com.example.todo.controller.TagController` — thin delegate to `TagService`

#### Scenario: Create unique tag succeeds
- **WHEN** authenticated user sends POST request to `/v1/tags` with `"name": "Work"` in the body
- **THEN** system stores the new tag associated with that user's account and returns 201 Created

#### Scenario: Duplicate tag name rejected for same user
- **WHEN** authenticated user sends POST request to `/v1/tags` with a `"name"` that matches an existing tag they own after trimming and case-insensitive comparison (e.g. `"work"` when `Work` exists)
- **THEN** system rejects the request and returns 409 Conflict

#### Scenario: Concurrent creation of the same tag never fails with 500
- **WHEN** two concurrent requests send POST to `/v1/tags` with the same new tag name for the same user
- **THEN** exactly one request returns 201 Created and the other returns 409 Conflict
- **AND** exactly one tag row exists for that normalized name

### Requirement: Tag Assignment on Task Create
**ID**: REQ-TAG-002
The system SHALL accept an optional `tagNames[]` array in POST requests to `/v1/tasks`. When provided, the system resolves each tag name to a user-scoped existing tag or creates it automatically if it does not yet exist for that user. Tag names are normalized (trimmed and case-insensitive) before resolution. Concurrent creation of the same tag reuses it atomically instead of failing. The task and its resolved tags MUST be persisted atomically: if the task cannot be saved, none of the tags resolved for it are left committed.

**Affected files**:
- `com.example.todo.service.TagService.resolve(User, List<String>)` — batch lookup + normalized identity + retry on concurrent creation (moved from `TaskService`)
- `com.example.todo.repository.TagRepository.findByUserId(Long userId)` — batch lookup
- `com.example.todo.service.TaskService.createTask()` — delegates `resolve` to the tag module and persists task + tags in one transaction

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
- **WHEN** two concurrent requests create tasks with the same new tag name (e.g., `"tagNames": ["NewTag"]`)
- **THEN** both requests succeed with 201 Created and only one tag row exists in the database (the second request reuses the first creation)

#### Scenario: Failed task save leaves no orphan tags
- **WHEN** task persistence fails after tags have been resolved for the request
- **THEN** the operation rolls back and no tag row created for this request is committed

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
