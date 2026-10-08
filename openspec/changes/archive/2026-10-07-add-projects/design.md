# Design

## Context

See `proposal.md` — Why. `TagService` already establishes the pattern for a user-scoped, case-insensitive, ownership-guarded module that never exposes entities. Projects should mirror it. `TaskService` already orchestrates cross-module work (tags) inside a transaction.

## Goals / Non-Goals

**Goals:**
- A project container with the same identity/ownership guarantees as tags.
- A task has at most one project; assignment is validated against the user's scope.

**Non-Goals:**
- Sharing, nesting, per-project members, archival, project-level ordering.

## Decisions

1. **Single optional project per task (nullable FK)** (chosen).
   - Rationale: matches the mental model (a task lives in one list) and keeps queries simple.
   - Alternative: many-to-many — rejected: projects would duplicate tags' role.
   - Alternative: nested projects — rejected: unnecessary complexity now.
2. **`ProjectService` mirrors `TagService`** (normalized CI identity, `CurrentUserProvider` ownership, returns `ProjectResponse` only).
   - Alternative: fold into `TaskService` — rejected: violates module ownership.
3. **Delete unassigns, via `ON DELETE SET NULL` on `tasks.project_id`** (chosen).
   - Rationale: force-free deletion, matching tag-deletion UX; no orphan tasks.
   - Alternative: block deletion when non-empty — rejected: friction for a personal app.
4. **Foreign/unknown `projectId` -> 400 `errors.projectId`** (chosen) at the task boundary, resolved through the project module.
   - Alternative: 404 — rejected: it is a body field, so a field-level 400 is more consistent with validation.

## Migration Plan

`V7__add_projects.sql`:
```sql
CREATE TABLE projects (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX uq_user_project_ci ON projects (user_id, lower(name));
ALTER TABLE tasks ADD COLUMN project_id BIGINT NULL REFERENCES projects(id) ON DELETE SET NULL;
```
Rollback drops `tasks.project_id` and the `projects` table.

## Test Strategy

- **Unit (backend):** `ProjectServiceTest` — CI duplicate -> 409, trim, ownership; `TaskServiceTest` — foreign project supplied -> 400 field error.
- **Integration (backend, Postgres):** project CRUD + ownership; assign/clear on a task; delete project leaves tasks with `projectId: null`.
- **Unit/Component (frontend):** repository project ops; header filter by project; modal project selector round-trip.
