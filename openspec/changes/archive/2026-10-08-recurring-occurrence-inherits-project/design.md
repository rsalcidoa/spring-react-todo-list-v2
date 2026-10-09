# Design

## Context

See `proposal.md` — Why. `generateNextOccurrence` (`TaskService.java:251-277`)
already copies title/description/priority/tags/recurrence and shifts the reminder.
`validateRecurrence` (`:208-212`) only checks that a non-`NONE` rule has a
`dueDate`; `applyParent` runs just before it in both create and update.

## Goals / Non-Goals

**Goals:**
- The next occurrence keeps its Project.
- A Subtask cannot carry a recurrence.

**Non-Goals:**
- Inheriting `parent`.
- Changing the recurrence generation trigger or idempotency.

## Decisions

1. **`next.setProject(completed.getProject())`** in `generateNextOccurrence`.
   - Rationale: a recurring Task's Project is part of its identity; the omission
     was an oversight relative to the copied fields.
   - Alternative: copy `projectId` by re-lookup — rejected: the entity is already
     attached.
2. **Extend `validateRecurrence`** to throw `InvalidQueryValueException("recurrence",
   …)` when `task.getParent() != null` and the rule is not `NONE`.
   - Rationale: a recurring Subtask would generate a top-level Task, breaking the
     one-level Subtask rule; the existing validation method is the natural seam
     and already runs after `applyParent`.
   - Alternative: validate in `applyParent` — rejected: recurrence is the offending
     field, and field-named errors stay in `validateRecurrence`.

## Risks / Trade-offs

- [Existing tasks with a recurring Subtask would start failing] → none exist in the
  model tests; the API now rejects them, which is the intent.
- [Project deleted between completion and read] → the FK already nulls the task's
  project, so `completed.getProject()` is null and the occurrence is project-less.

## Migration Plan

No Flyway migration; the `project_id` column already exists. Behavior change only.

## Test Strategy

- **Integration (backend, Postgres):** `RecurringApiIntegrationTest` — a recurring
  project Task's next occurrence carries the `projectId`; a create with `parentId` +
  `recurrence` returns 400 `errors.recurrence`.
- **Unit:** `RecurrenceRuleTest` unchanged.
