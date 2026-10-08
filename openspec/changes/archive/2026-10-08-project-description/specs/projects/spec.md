# Spec Delta

## MODIFIED Requirements

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
