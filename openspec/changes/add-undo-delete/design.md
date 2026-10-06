# Design

## Context

See `proposal.md` — Why. `TaskService.deleteTask` currently calls `taskRepository.delete(task)`. Listings go through `findByUser`/`findByUserAndStatus` (and, with `add-task-query`, a Specification). `UserService` already shows the injected-clock pattern for token expiry, which the soft-delete timestamp should follow.

## Goals / Non-Goals

**Goals:**
- A delete that is invisible to normal reads but reversible.
- One place that hides deleted rows, applied to every listing path.

**Non-Goals:**
- A trash screen, retention/purge policy, undo for non-delete mutations.

## Decisions

1. **Soft delete via `deletedAt` + injectable `Clock`** (chosen).
   - Rationale: reversible, testable timestamps, multi-device safe (server state).
   - Alternative: delayed client-side delete (a timer before sending DELETE) — rejected: navigating away or closing the tab loses the task.
2. **`restore` endpoint rather than a client-only undo** (chosen).
   - Rationale: the undo can be triggered after a refresh, and any client can restore.
3. **Every listing path filters `deletedAt is null`** (chosen): the base `findByUser*` methods and the `add-task-query` Specification include it.
   - Rationale: one invariant; otherwise a deleted task leaks through a new query.
4. **No purge now** (chosen): soft-deleted rows are kept; a future change can add retention.
   - Alternative: purge after N days via a job — deferred.

## Risks / Trade-offs

- [A new query forgets the deleted filter] -> centralize the predicate in the Specification and the repository methods; cover with an integration test that asserts a deleted task never appears.
- [Subtasks of a soft-deleted parent] -> board already hides subtasks; restore brings the parent back and children were never individually deleted.
- [Unique constraints unaffected] -> soft-deleted rows still hold tag/project FKs; no conflict.

## Migration Plan

`V10__add_task_soft_delete.sql`: `ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMP NULL;`. Rollback drops the column (soft-deleted rows would then reappear — acceptable for rollback).

## Test Strategy

- **Unit (backend):** `TaskServiceTest` — delete sets `deletedAt`, restore clears it, idempotent restore.
- **Integration (backend, Postgres):** deleted task hidden from list and `GET`; restore brings it back; 403/404.
- **Component (frontend):** undo affordance restores the task; window expiry keeps it deleted; failure shows the banner.
