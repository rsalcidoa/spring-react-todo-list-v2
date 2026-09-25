# Spec Delta — tagging

## MODIFIED Requirements

### Requirement: Tag Assignment on Task Create

The system SHALL accept an optional `tagNames[]` array in POST requests to `/v1/tasks`. When provided, the system resolves each tag name to a user-scoped existing tag or creates it automatically if it does not yet exist for that user. Tag names are normalized (trimmed and case-insensitive) before resolution. Concurrent creation of the same tag reuses it atomically instead of failing.

**ID**: REQ-TAG-002
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

The system SHALL accept an optional `tagNames[]` array in PUT requests to `/v1/tasks/{id}`. The request replaces all tags currently assigned to the task with the specified set; each tag name is resolved from or created into the user's tag scope. Tag names are normalized (trimmed and case-insensitive) before resolution.

**ID**: REQ-TAG-003
**Affected files**: 
- `com.example.todo.service.TaskService.updateTask()` — uses same normalized `resolveTag()` as create
- `com.example.todo.repository.TagRepository.findByUserId(Long userId)` — new derived method for batch lookup

#### Scenario: Replace task tags via update
- **WHEN** user sends PUT request to `/v1/tasks/123` with `"tagNames": ["Personal"]` where the task previously had different tags
- **THEN** system removes all previous tags from the task, assigns "Personal", and returns 200 OK

#### Scenario: Update resolves tag names case-insensitively
- **WHEN** user sends PUT request to `/v1/tasks/123` with `"tagNames": ["work"]` where `Work` already exists for that user
- **THEN** system trims and matches case-insensitively, assigns the existing `Work` tag (no duplicate created)
