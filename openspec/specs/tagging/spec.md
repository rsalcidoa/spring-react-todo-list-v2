# Tag Specification

## Purpose
Provides user-scoped tag creation and assignment to tasks with dropdown-based selection in the task creation and editing interface, enabling hierarchical organization of tasks by category without cross-user visibility.

## Requirements

### Requirement: Tag Entity Uniqueness Per User
The system SHALL enforce uniqueness of tag names within a single user's scope. Each user may create tags with distinct names; tag names are scoped per user so two users can have tags with the same name independently.

#### Scenario: Create unique tag succeeds
- **WHEN** authenticated user sends POST request to `/v1/tags` with `"name": "Work"` in the body
- **THEN** system stores the new tag associated with that user's account and returns 201 Created

#### Scenario: Duplicate tag name rejected for same user
- **WHEN** authenticated user sends POST request to `/v1/tags` with a `"name"` matching an existing tag they own
- **THEN** system rejects the request and returns 409 Conflict or 422 Unprocessable Entity

### Requirement: Tag Assignment on Task Create
**ID**: REQ-TAG-002
The system SHALL accept an optional `tagNames[]` array in POST requests to `/v1/tasks`. When provided, the system resolves each tag name to a user-scoped existing tag or creates it automatically if it does not yet exist for that user. Tag names are normalized (trimmed and case-insensitive) before resolution. Concurrent creation of the same tag reuses it atomically instead of failing.

**Affected files**: 
- `com.example.todo.service.TaskService.resolveTag()` — uses `TransactionTemplate` + batch lookup; trim + case-insensitive matching; creates tag only if not found
- `com.example.todo.repository.TagRepository.findByUserId(Long userId)` — new derived method for batch lookup

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

### Requirement: Tag Assignment on Task Update
**ID**: REQ-TAG-003
The system SHALL accept an optional `tagNames[]` array in PUT requests to `/v1/tasks/{id}`. The request replaces all tags currently assigned to the task with the specified set; each tag name is resolved from or created into the user's tag scope. Tag names are normalized (trimmed and case-insensitive) before resolution.

**Affected files**: 
- `com.example.todo.service.TaskService.updateTask()` — uses same normalized `resolveTag()` as create
- `com.example.todo.repository.TagRepository.findByUserId(Long userId)` — new derived method for batch lookup

#### Scenario: Replace task tags via update
- **WHEN** user sends PUT request to `/v1/tasks/123` with `"tagNames": ["Personal"]` where the task previously had different tags
- **THEN** system removes all previous tags from the task, assigns "Personal", and returns 200 OK

#### Scenario: Update resolves tag names case-insensitively
- **WHEN** user sends PUT request to `/v1/tasks/123` with `"tagNames": ["work"]` where `Work` already exists for that user
- **THEN** system trims and matches case-insensitively, assigns the existing `Work` tag (no duplicate created)

### Requirement: Tag Response in Task Objects
The system SHALL include a `tags` array (containing tag name strings) in every response object returned by POST `/v1/tasks`, GET `/v1/tasks/{id}`, PUT `/v1/tasks/{id}`, and the task objects within GET `/v1/tasks`.

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
The system SHALL allow authenticated users to retrieve their own tags via a GET request to `/v1/tags`, returning an array of tag objects sorted alphabetically by name.

#### Scenario: Successful tag listing
- **WHEN** authenticated user sends GET request to `/v1/tags`
- **THEN** system returns 200 OK with an array of the user's tags, each containing `id` and `name`, sorted alphabetically

### Requirement: Create User Tag
The system SHALL allow authenticated users to create a new tag for their own account via POST request to `/v1/tags`. The name field is required, must be 1–50 characters, and must not match an existing tag owned by the same user.

#### Scenario: Successful tag creation
- **WHEN** authenticated user sends POST request to `/v1/tags` with `"name": "Personal"` (unique for that user)
- **THEN** system stores the new tag associated with the user's account and returns 201 Created

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
