# Proposal

## Why

Repetitive tasks (daily standup, weekly review, monthly invoices) must be recreated by hand today. Block B (tiempo) makes the app reduce that manual work by generating the next occurrence when a recurring task is completed.

## What Changes

- Add `recurrence` to a task: `NONE` (default), `DAILY`, `WEEKLY`, `MONTHLY`, with migration `V6__add_task_recurrence.sql` (`recurrence`, `recurrence_source_id`).
- When a task with a non-`NONE` recurrence transitions to `COMPLETED`, the system creates exactly one next occurrence (new task, status `PENDING`, due date advanced by the rule, same title/description/priority/tags/recurrence, reminder shifted by the same delta).
- Frontend: a recurrence selector in the modal and a small "se repite" indicator on recurring cards.

**Non-goals:**
- Full RRULE/cron, custom intervals (e.g. every 2 weeks), skip/exception editing of a series, editing the whole series at once.

**Rollback plan:** remove the selector and the generation step, and drop the two columns (migration down). Existing generated tasks are ordinary tasks and remain valid.

## Capabilities

### New Capabilities

- `recurrence`: compute and materialize the next occurrence of a recurring task.

### Modified Capabilities

- `task-management`: adds a "Task Recurrence Field" requirement (optional `recurrence`, requires a due date).
- `task-status`: adds a "Recurring Generation on Completion" requirement (one next occurrence per completion).

## Impact

- **Backend (Java):** `model/Task` (+`recurrence`, `recurrenceSourceId`), `dto/TaskRequest`/`TaskResponse`, `service/TaskService` (generation on completion), a pure `service/RecurrenceRule`, `repository/TaskRepository`, migration `V6`.
- **Frontend (TS):** `frontend/src/components/AddTaskModal.tsx`, `frontend/src/components/KanbanCard.tsx` (indicator), `frontend/src/services/types/task.ts`.
- **API:** additive; `NONE` preserves current behavior.
