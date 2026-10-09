# Proposal

## Why

Completing a task by **dragging it to the Completed column** (or moving it with
the keyboard) does not record the completion date, and the board never shows it
without a reload:

- The drag path goes through `PATCH /v1/tasks/{id}/position` →
  `TaskOrderingService.reorder`, which changes the Status but never sets or clears
  `completedAt` (only `TaskService.create/update/applyStatus` do).
- The frontend's `TaskStore.move` and `OrderingStore.reorder` discard the response,
  so the local task is not updated with the server's `completedAt`.

So REQ-TM-012 ("set on the transition to COMPLETED") is violated on the most common
completion path.

## What Changes

- **Backend**: move the completion-timestamp rule into `TaskAccess` (the task-state
  policy owner) and call it from `TaskOrderingService.reorder` as well as
  `TaskService`, so any transition to/from `COMPLETED` sets/clears `completedAt`.
- **Frontend**: `move` and `reorder` return the updated `Task`; the HTTP adapters
  map the response, the in-memory adapter maintains `completedAt` on transitions,
  and the board controller reflects the returned task immediately.

**Non-goals**:
- Changing when completion is recorded (still on the Status transition).
- Refetching the whole board after a move.

**Scope**: `backend/src` + `frontend/src`. Bug fix conforming to REQ-TM-012.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `task-management`: REQ-TM-012 (Task Completion Timestamp) is extended to cover
  the ordering/position path.

## Impact

Affected files:
- `backend/.../service/TaskAccess.java` — `applyCompletionTimestamp` (moved here).
- `backend/.../service/TaskService.java`, `TaskOrderingService.java` — call it.
- `frontend/src/data/TaskRepository.ts` — `move`/`reorder` return the task; the
  in-memory adapter maintains `completedAt`.
- `frontend/src/services/boardMutations.ts` — `runOptimistic` gains `onSuccess`.
- `frontend/src/pages/useBoard.ts` — reflects the returned task on move/reorder.
- Tests: `CompletionApiIntegrationTest`, `taskRepository.contract.test.ts`,
  `useBoard.test.ts`.

No API shape change and no migration.

**Rollback plan**: revert `TaskOrderingService` and the port return types.

> Follow-up fixing the completion-date coverage found during manual testing.
