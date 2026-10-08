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
The system SHALL return the authenticated user's projects via `GET /v1/projects`, each containing exactly `id`, `name` and `description`, sorted case-insensitively by name. `description` SHALL be `null` when not set.

**ID**: REQ-PRJ-002
**Affected files**:
- `com.example.todo.controller.ProjectController.getAllProjects()`
- `com.example.todo.service.ProjectService.list(User)`
- `com.example.todo.dto.ProjectResponse`

#### Scenario: Successful project listing
- **WHEN** the authenticated user calls `GET /v1/projects`
- **THEN** system returns 200 OK with the user's projects (`id`, `name`, `description`) sorted by name

### Requirement: Create User Project
The system SHALL create a project for the authenticated user via `POST /v1/projects` with a required `name` of 1–50 characters after trimming and an optional `description` of at most 500 characters. Invalid names or descriptions return 400 with `errors.name` / `errors.description`.

**ID**: REQ-PRJ-003
**Affected files**:
- `com.example.todo.dto.ProjectRequest` — `name` (`@NotBlank @Size(max=50)`), `description` (`@Size(max=500)`)
- `com.example.todo.controller.ProjectController.createProject()`

#### Scenario: Blank or oversized name rejected
- **WHEN** the user posts an empty or >50-char name
- **THEN** system returns 400 Bad Request with `errors.name`

#### Scenario: Create a project with a description
- **WHEN** the user creates a project with a name and a description within limits
- **THEN** system returns 201 Created echoing the `description`

#### Scenario: Oversized description rejected
- **WHEN** the user posts a description longer than 500 characters
- **THEN** system returns 400 Bad Request with `errors.description`

### Requirement: Rename User Project
The system SHALL update an owned project via `PUT /v1/projects/{id}`, accepting the same `name` and optional `description` with the same validation and uniqueness rules. Renaming to an existing (normalized) sibling name returns 409; another user's project returns 403; a missing id returns 404.

**ID**: REQ-PRJ-004
**Affected files**: `com.example.todo.controller.ProjectController.updateProject()`, `com.example.todo.service.ProjectService.rename(...)`

#### Scenario: Rename an owned project
- **WHEN** the user renames their project to a new unique name
- **THEN** system returns 200 OK with the updated project

#### Scenario: Edit the description
- **WHEN** the user updates a project with a new description
- **THEN** system returns 200 OK echoing the new `description`

### Requirement: Project Ownership Enforcement
Every project operation SHALL verify the authenticated user is the owner, through `CurrentUserProvider.requireOwned`, so project and task ownership decisions cannot drift.

**ID**: REQ-PRJ-006
**Affected files**: `com.example.todo.service.ProjectService`, `com.example.todo.controller.ProjectController`

#### Scenario: Cross-user access forbidden
- **WHEN** a user tries to read, rename or delete another user's project
- **THEN** system returns 403 Forbidden (or lists only their own projects)

### Requirement: Delete User Project and Its Tasks
The system SHALL delete an owned project via `DELETE /v1/projects/{id}` together with every task that belongs to it, including their subtasks. Deleting another user's project returns 403; a missing id returns 404.

**ID**: REQ-PRJ-005
**Affected files**:
- `com.example.todo.service.ProjectService.delete(Long)`
- `com.example.todo.repository.TaskRepository`

#### Scenario: Delete removes the project and its tasks
- **WHEN** the user deletes a project that has tasks
- **THEN** the project is removed and its tasks (and their subtasks) no longer exist

#### Scenario: Unrelated tasks remain
- **WHEN** the user deletes one project
- **THEN** tasks that do not belong to it are unchanged
