# Proposal

## Why

Ownership (CONTEXT.md: a User may only read or change their own resources) has
one home for Tasks — `TaskAccess` — but is re-implemented inline in
`ProjectService` (rename, delete) and `TagService.delete` as the same
`findById -> 404 -> requireOwned (403)` sequence. The domain concept has no
module of its own.

## What Changes

- **New `Ownership` module** (`service/Ownership.java`) owning the policy: `lookup`
  (404), `requireOwned(entity)` (403) and the composed `requireOwned(id, …)`.
- **`TaskAccess`, `ProjectService` and `TagService` cross it** instead of
  re-implementing the lookup + ownership check.
- **The sub-resource `projectId`/`parentId` validation stays 400.** Task-management
  and subtasks specs mandate 400 for an unknown or foreign reference (a field-level
  validation error), so those paths keep their `InvalidQueryValueException`. This
  corrects the architecture review's premise: the 400 was deliberate, not drift.
- **Hard-delete of a Project's Tasks stays** (REQ-PRJ-005), per the earlier decision.

**Non-goals**:
- Changing any status code: no 400 → 403/404 moves.
- Changing the soft-delete/restore cascade of Tasks (stays in `TaskAccess`).
- Any API, DTO or migration change.

**Scope**: `backend/src/main` + `backend/src/test`. Pure refactor (`skip_specs`).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
<!-- none: pure refactor, skip_specs -->

## Impact

Affected files:
- `backend/src/main/java/com/example/todo/service/Ownership.java` (new).
- `backend/src/main/java/com/example/todo/service/TaskAccess.java`,
  `ProjectService.java`, `TagService.java` — use the module.
- Tests: `OwnershipTest` (new) and the constructor updates in `TaskAccessTest`,
  `ReminderServiceTest`, `TaskServiceTest`, `TagServiceTest`.

No API or data migration. Extends ADR-0003 (Task ownership) to a shared policy
without changing its meaning; the observable error contract is byte-identical.

**Rollback plan**: inline the lookup + `requireOwned` again in the three services.

> Fifth of five architectural deepenings. Independent of the frontend work.
