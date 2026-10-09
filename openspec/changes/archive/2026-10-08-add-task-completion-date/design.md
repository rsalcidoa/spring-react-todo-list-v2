# Design

## Context

See `proposal.md` — Why. `Task` has `createdAt`/`updatedAt` but no completion
timestamp; `updatedAt` changes on every save. The Status is applied in
`TaskService.applyFields` (create/update) and `applyStatus` (PATCH). The frontend
card renders due state through `presentTask` (`taskPresentation.ts`).

## Goals / Non-Goals

**Goals:**
- One timestamp recording the completion moment, maintained on the Status
  transition.
- Show it on the card, localized, without removing the Due-state chip.

**Non-Goals:**
- A Clock seam (the task model already uses `LocalDateTime.now()`).
- Reopening semantics beyond clearing the timestamp.

## Decisions

1. **A nullable `completedAt` column and a `TaskService` helper**
   `applyCompletionTimestamp(task, previousStatus)`:
   - `current == COMPLETED && previous != COMPLETED` → set `now`;
   - `current != COMPLETED` → clear.
   - Called from `createTask` (previous null), `updateTask` and `applyStatus`
     (previous captured before applying the new status).
   - Rationale: one place owns the transition rule; callers pass the prior status.
   - Alternative: a JPA `@PreUpdate` listener — rejected: it cannot see the
     previous status from the entity alone.
2. **Migration `V13__add_task_completed_at.sql`**: `ALTER TABLE tasks ADD COLUMN
   completed_at TIMESTAMP NULL;` (additive).
3. **`TaskResponse` echoes `completedAt`** (nullable, ISO); the frontend `Task`
   gains `completedAt?: string` and `fromWire` maps it. It is server-managed, so
   `toWire` does not send it.
4. **`presentTask` returns `completedLabel`** when `completed && completedAt`,
   formatting the date part (`completedAt.slice(0,10)`) through `formatDate`; the
   card renders it next to the Due-state chip, so a completed overdue task shows
   both.

## Risks / Trade-offs

- [Timestamp set on create-with-COMPLETED] → allowed; `previous` is null so it is
  set, matching the requirement.
- [`LocalDateTime.now()` not injectable] → consistent with the model; testability
  comes from asserting non-null/cleared rather than an exact instant.
- [Card density] → the completion chip is small and muted; the card already wraps.

## Migration Plan

Flyway `V13` adds the nullable column (no backfill). Frontend build unaffected.

## Test Strategy

- **Integration (backend, Postgres):** `CompletionApiIntegrationTest` — complete
  sets `completedAt`; reopen clears it; a never-completed task is null; re-saving a
  completed task keeps it.
- **Unit (frontend):** `taskPresentation.test.ts` (`completedLabel` present/absent),
  `KanbanCard.test.tsx` (renders the completion date, and both chips for a
  completed overdue task).
