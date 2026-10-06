# Design

## Context

See `proposal.md` — Why. `TaskService.applyStatus`/`updateTask` already persist status transitions inside `withTagRetry`'s transaction. `Recurrence` is a new enum on `Task`. Note: the reminder-shift clause activates only if the `add-task-reminders` field `reminderAt` is present; otherwise it is a no-op.

## Goals / Non-Goals

**Goals:**
- A single pure place to compute the next due date.
- Exactly one next occurrence per completion, race-safe.

**Non-Goals:**
- RRULE/cron, custom intervals, series editing, skip exceptions.

## Decisions

1. **Enum rule (`NONE|DAILY|WEEKLY|MONTHLY`) + pure `RecurrenceRule.nextDueDate`** (chosen).
   - Rationale: covers the common cases with a trivial, unit-testable function.
   - Alternative: full RRULE string parsing — rejected: large scope for little gain now.
2. **Generate on transition to `COMPLETED`** (chosen), inside the existing transaction.
   - Alternative: generate lazily on read — rejected: writes hidden in reads, surprising.
   - Alternative: a scheduled job — rejected: not needed, adds infra.
3. **Idempotency via `recurrenceSourceId`** (chosen): before generating, check no task already references this one as source; the unique-ish link guards re-completion.
   - Alternative: a boolean `nextGenerated` flag — rejected: the reverse link is also useful for display.
4. **Monthly clamps to month end** (`+1 month`, day = min(day, lastDay)) (chosen) rather than rolling into the next month.
   - Alternative: roll over (Jan 31 -> Mar 3) — rejected: surprises the user.

## Completion flow

```mermaid
sequenceDiagram
  participant C as TaskController
  participant S as TaskService
  participant DB as task table
  C->>S: applyStatus(id, "COMPLETED") / updateTask
  S->>DB: load task, check ownership
  S->>S: parse status; detect non->COMPLETED transition
  alt recurrence != NONE and no child with recurrence_source_id = id
    S->>S: next = RecurrenceRule.nextDueDate(task)
    S->>DB: save new PENDING task (same fields/tags, recurrence_source_id = id)
  end
  S->>DB: save completed task
  S-->>C: TaskResponse
```

## Risks / Trade-offs

- [Concurrent completion could double-generate] -> generation and the guard check happen in the same transaction; the `recurrenceSourceId` lookup runs before the insert.
- [Month-end ambiguity] -> clamp, covered by a boundary test.
- [Tag copying] -> reuse the task's current tag ids directly (no re-resolution needed).

## Migration Plan

Flyway `V6__add_task_recurrence.sql`: `ALTER TABLE tasks ADD COLUMN recurrence VARCHAR(10) NOT NULL DEFAULT 'NONE', ADD COLUMN recurrence_source_id BIGINT NULL REFERENCES tasks(id);`. Rollback drops both columns.

## Test Strategy

- **Unit (backend):** `RecurrenceRuleTest` — daily/weekly/monthly incl. `2026-01-31 -> 2026-02-28`; `TaskServiceTest` — generation creates one child, re-completion does not, `NONE` does nothing.
- **Integration (backend, Postgres):** complete a recurring task via PATCH and assert the child row exists once; recurrence-without-due-date -> 400.
- **Unit/Component (frontend):** recurrence selector round-trips into `TaskInput`; the card shows the "se repite" indicator.
