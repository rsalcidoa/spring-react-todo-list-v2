# Proposal

## Why

Two gaps in how a recurring Task materializes its next occurrence:

- A recurring Task assigned to a **Project** produces a next occurrence with **no
  Project** ("Sin proyecto"): `generateNextOccurrence` copies title, description,
  priority and tags but never the Project.
- A **Subtask** may carry a recurrence; completing it would spawn a **top-level**
  Task, which contradicts the one-level Subtask model.

Both were out of scope when recurrence was introduced (its proposal enumerated
the copied fields without Project) and are not covered by any spec or test.

## What Changes

- **Copy the Project** on the next occurrence: `next.setProject(completed.getProject())`.
- **Reject a recurrence on a Subtask**: creating/updating a Task with a `parentId`
  and a non-`NONE` `recurrence` returns **400** naming the `recurrence` field.
- **Document the inheritance**: a new requirement states which fields carry over
  (`title`, `description`, `priority`, `tags`, `recurrence`, `project`; reminder
  shifted) and that `parent` is not carried.

**Non-goals**:
- Copying `parent` (a Subtask cannot recur).
- Series editing, custom intervals, or changing the next-due-date rules.

**Scope**: `backend/src`. Behavior change, documented in the `recurrence` specs.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `recurrence`: a new requirement "Next Occurrence Field Inheritance" adds Project
  inheritance and forbids recurrence on Subtasks.

## Impact

Affected files:
- `backend/src/main/java/com/example/todo/service/TaskService.java` —
  `generateNextOccurrence` copies the project; `validateRecurrence` rejects a
  Subtask recurrence.
- `backend/src/test/java/com/example/todo/RecurringApiIntegrationTest.java` —
  project inheritance and Subtask-recurrence rejection.

No API shape change (the `projectId` field already exists on the response) and no
migration. Consistent with the one-level Subtask rule (REQ-SUB-001..003).

**Rollback plan**: drop the `setProject` call and the Subtask guard.

> Second of the current batch; a backend behavior fix.
