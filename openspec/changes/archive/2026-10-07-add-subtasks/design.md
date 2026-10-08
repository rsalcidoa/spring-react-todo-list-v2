# Design

## Context

See `proposal.md` — Why. `TaskService` already carries ownership and the unified error contract; the board query lives in `TaskRepository`. A subtask is a self-referencing task, so this is mostly a validation + query concern, not a new data flow.

## Goals / Non-Goals

**Goals:**
- One level of children with cheap progress and safe deletion.
- Subtasks never leak into the board listing by accident.

**Non-Goals:**
- Arbitrary nesting, subtask ordering, auto-completing the parent.

## Decisions

1. **One level only** (chosen). A parent cannot itself be a subtask.
   - Rationale: matches a checklist mental model and avoids cycle detection and deep recursion.
   - Alternative: arbitrary nesting — rejected: needs cycle guards and recursive UI.
2. **`SubtaskService` owns validation and progress** (chosen), reusing `CurrentUserProvider`.
   - Alternative: inline in `TaskService` — rejected: the one-level rule and progress deserve their own seam.
3. **Cascade delete at the DB (`ON DELETE CASCADE`) plus JPA mapping** (chosen).
   - Rationale: deleting a parent must not leave orphan subtasks; the DB enforces it even outside JPA.
   - Alternative: unassign children on parent delete — rejected: a subtask without a parent is meaningless.
4. **Board query filters `parent is null`** (chosen); children fetched per parent.
   - Alternative: return everything and let the client nest — rejected: heavy payload and error-prone.

## Position in the data model

```
tasks
  id, ...
  parent_id  BIGINT NULL REFERENCES tasks(id) ON DELETE CASCADE
  (CHECK: parent_id IS NULL OR parent.parent_id IS NULL)  -- one level, enforced in service
```

## Migration Plan

`V8__add_subtasks.sql`: `ALTER TABLE tasks ADD COLUMN parent_id BIGINT NULL REFERENCES tasks(id) ON DELETE CASCADE;`. Rollback drops the column.

## Test Strategy

- **Unit (backend):** `SubtaskServiceTest` — one-level rule, foreign parent -> 400, progress counts, cascade wiring.
- **Integration (backend, Postgres):** create a subtask, fetch `GET /v1/tasks/{id}/subtasks`, board excludes it, delete parent cascades, delete child keeps parent.
- **Unit/Component (frontend):** repository subtask ops; modal shows/edits subtasks; parent card shows `done/total`.
