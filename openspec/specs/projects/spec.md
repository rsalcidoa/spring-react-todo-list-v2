# projects Specification

## Purpose
Gives users user-scoped project containers so tasks can be separated by area of work, independent of tags.

## Requirements

### Requirement: Project Identity Per User
The system SHALL enforce project-name uniqueness within a user's scope using normalized identity (trimmed, case-insensitive), at both the module and the database (functional unique index on `(user_id, lower(name))`). A duplicate SHALL return 409 Conflict.

**ID**: REQ-PRJ-001
**Affected files**:
- `com.example.todo.service.ProjectService` — normalized create-or-reject
- `com.example.todo.repository.ProjectRepository` — case-insensitive lookup
- `backend/src/main/resources/db/migration/V7__add_projects.sql` — unique index

#### Scenario: Create a unique project
- **WHEN** an authenticated user creates a project named "Casa"
- **THEN** system returns 201 Created with `id` and `name`

#### Scenario: Case-insensitive duplicate rejected
- **WHEN** "Casa" exists and the user creates " casa "
- **THEN** system returns 409 Conflict and creates no row

### Requirement: List User Projects
The system SHALL return the authenticated user's projects via `GET /v1/projects`, each containing exactly `id` and `name`, sorted case-insensitively by name.

**ID**: REQ-PRJ-002
**Affected files**:
- `com.example.todo.controller.ProjectController.getAllProjects()`
- `com.example.todo.service.ProjectService.list(User)`

#### Scenario: Successful project listing
- **WHEN** the authenticated user calls `GET /v1/projects`
- **THEN** system returns 200 OK with the user's projects (id, name only) sorted by name

### Requirement: Create User Project
The system SHALL create a project for the authenticated user via `POST /v1/projects` with a required `name` of 1–50 characters after trimming. Invalid names return 400 with `errors.name`.

**ID**: REQ-PRJ-003
**Affected files**:
- `com.example.todo.dto.ProjectRequest` — `name` with `@NotBlank @Size(max=50)`
- `com.example.todo.controller.ProjectController.createProject()`

#### Scenario: Blank or oversized name rejected
- **WHEN** the user posts an empty or >50-char name
- **THEN** system returns 400 Bad Request with `errors.name`

### Requirement: Rename User Project
The system SHALL rename an owned project via `PUT /v1/projects/{id}` with the same validation and uniqueness rules. Renaming to an existing (normalized) sibling name returns 409; another user's project returns 403; a missing id returns 404.

**ID**: REQ-PRJ-004
**Affected files**: `com.example.todo.controller.ProjectController.updateProject()`, `com.example.todo.service.ProjectService.rename(...)`

#### Scenario: Rename an owned project
- **WHEN** the user renames their project to a new unique name
- **THEN** system returns 200 OK with the updated project

### Requirement: Delete User Project
The system SHALL delete an owned project via `DELETE /v1/projects/{id}` and unassign it from every task that referenced it, leaving those tasks intact. Deleting another user's project returns 403; a missing id returns 404.

**ID**: REQ-PRJ-005
**Affected files**: `com.example.todo.controller.ProjectController.deleteProject()`, `com.example.todo.service.ProjectService.delete(...)`

#### Scenario: Delete unassigns tasks
- **WHEN** the user deletes a project assigned to tasks
- **THEN** the project is removed and its tasks remain, now without a project

### Requirement: Project Ownership Enforcement
Every project operation SHALL verify the authenticated user is the owner, through `CurrentUserProvider.requireOwned`, so project and task ownership decisions cannot drift.

**ID**: REQ-PRJ-006
**Affected files**: `com.example.todo.service.ProjectService`, `com.example.todo.controller.ProjectController`

#### Scenario: Cross-user access forbidden
- **WHEN** a user tries to read, rename or delete another user's project
- **THEN** system returns 403 Forbidden (or lists only their own projects)
