# Spec Delta — tagging (DB-level identity + no-500 guarantee)

## MODIFIED Requirements

### Requirement: Tag Entity Uniqueness Per User
The system SHALL enforce uniqueness of tag names within a single user's scope using the normalized identity of a tag: names are trimmed and compared case-insensitively. Enforcement lives at BOTH layers: normalized matching in `TagService` and a database functional unique index on `(user_id, lower(name))` (Flyway `V4__tag_identity_ci`), so concurrent creations of case-variants cannot slip through. Each user may create tags with distinct normalized names; tag names are scoped per user so two users can have tags with the same name independently. A duplicate by normalized identity for the same user is rejected with 409 Conflict. A concurrent creation of the same tag reuses the existing tag or returns 409 — it MUST NOT fail with 500.

**ID**: REQ-TAG-001
**Affected files**:
- `com.example.todo.service.TagService` — owns tag identity: normalized matching (trim + case-insensitive), create-or-reuse with retry on concurrent creation, duplicate → 409
- `com.example.todo.controller.TagController` — thin delegate to `TagService`
- `db/migration/V4__tag_identity_ci.sql` — dedupe preexistente + índice único funcional `(user_id, lower(name))`
- `com.example.todo.model.Tag` — sin `uniqueConstraints` en `@Table` (el índice funcional no es expresable ahí; ver V4)

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
- `com.example.todo.service.TagService.resolve(User, List<String>)` — batch lookup + normalized identity + retry on concurrent creation (moved from `TaskService`)
- `com.example.todo.repository.TagRepository.findByUserId(Long userId)` — batch lookup
- `com.example.todo.service.TaskService.createTask()` — delegates `resolve` to the tag module and persists task + tags in one transaction; retry exhaustion throws the duplicate-tag failure (409)

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
