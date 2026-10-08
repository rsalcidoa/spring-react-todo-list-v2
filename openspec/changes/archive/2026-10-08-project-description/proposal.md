# Proposal — Add an optional description to projects

## Why

Projects are just a name today, so there is nowhere to say what a project is
about. An optional description gives context in the manage dialog and as a
subtitle when a project is the active board scope.

## What Changes

- New nullable column `projects.description VARCHAR(500)` (Flyway `V12`).
- `Project.description`; `ProjectRequest.description` (`@Size(max = 500)`,
  optional); `ProjectResponse(id, name, description)`.
- `ProjectService.create/rename/list` carry the description.

**Non-goals:** project colors/icons; changing name validation or uniqueness;
the frontend UI (separate change).

**Rollback plan:** drop the column and revert the DTO/service changes; the API
falls back to the previous shape. Backend only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `projects`: `List User Projects`, `Create User Project` and `Rename User
  Project` include the optional `description`.

## Impact

- **Backend (Java):** `model/Project`, `dto/ProjectRequest`,
  `dto/ProjectResponse`, `service/ProjectService`,
  `resources/db/migration/V12__add_project_description.sql`, tests.
