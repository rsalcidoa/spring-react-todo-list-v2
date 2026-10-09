# Proposal

## Why

A Completed Task keeps its Due-state emphasis ("Vencida"/"Hoy") but gives no clue
about **when it was finished**. `Task` has `createdAt`/`updatedAt` but no
completion timestamp, and `updatedAt` changes on any edit, so it cannot answer
"when did I complete this?". After completing an overdue Task, the board still
labels it overdue with no completion date to balance it.

## What Changes

- **Record the completion moment**: a new nullable `completedAt` on a Task, set
  when its Status transitions to `COMPLETED` and cleared when it leaves
  `COMPLETED` (reopened to Pending/Active).
- **Expose it** in the task response and the frontend `Task` type.
- **Show it on the card**: a Completed Task shows "Completada: <fecha>" (date
  only) **alongside** the existing Due-state chip (a completed overdue Task shows
  both "Vencida" and "Completada").

**Non-goals**:
- Suppressing the Due-state chip for completed Tasks (the Due date is kept).
- A completion timestamp on Subtasks beyond what the Status field already implies.
- Changing the Status workflow.

**Scope**: `backend/src` (field + migration + DTO) and `frontend/src` (type,
presentation, card). Behavior change, documented in the specs.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `task-management`: a new requirement "Task Completion Timestamp" (REQ-TM-012).
- `frontend-integration`: REQ-FE-032 (Completed Task Treatment) is extended with
  the completion date.

## Impact

Affected files:
- `backend/src/main/java/com/example/todo/model/Task.java` — `completedAt`.
- `backend/src/main/resources/db/migration/V13__add_task_completed_at.sql` (new).
- `backend/src/main/java/com/example/todo/service/TaskService.java` — set/clear on
  the Status transition.
- `backend/src/main/java/com/example/todo/dto/TaskResponse.java` — expose it.
- `frontend/src/services/types/task.ts`, `frontend/src/data/TaskRepository.ts`,
  `frontend/src/services/taskPresentation.ts`,
  `frontend/src/components/KanbanCard.tsx` / `.module.css`,
  `frontend/src/i18n/es.ts` / `en.ts`.
- Tests: backend integration; `taskPresentation.test.ts`, `KanbanCard.test.tsx`.

Additive API field (nullable); no breaking change. New Flyway migration `V13`.

**Rollback plan**: drop the column (migration down), the DTO field and the card line.

> Fifth of the current batch; cross-tier, the largest of the set.
