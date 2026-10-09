# Design

## Context

See `proposal.md` — Why. `TaskAccess` owns the task-state policy (ownership,
soft-delete). The completion rule currently lives as a private method in
`TaskService`; `TaskOrderingService.reorder` (the drag path) does not apply it.
On the frontend, `move`/`reorder` return `void`.

## Goals / Non-Goals

**Goals:**
- One owner of the completion rule, applied on every status-changing write.
- The board shows the completion date immediately after a drag/keyboard move.

**Non-Goals:**
- A Clock seam.
- Refetching after mutations.

## Decisions

1. **Move `applyCompletionTimestamp(Task, TaskStatus previous)` into `TaskAccess`.**
   `TaskService` and `TaskOrderingService` call `taskAccess.applyCompletionTimestamp(...)`.
   - Rationale: it is task-state policy, and `TaskAccess` is already the shared seam
     for task mutation rules (ADR-0003); both services already hold it.
   - Alternative: a static util — rejected: no seam and easy to forget.
2. **`reorder` captures the previous status before applying the new one**, then
   sets/clears `completedAt`; the endpoint already returns the `TaskResponse`.
3. **`TaskStore.move` and `OrderingStore.reorder` return `Promise<Task>`.** The
   HTTP adapters map `fromWire(response.data)`; the in-memory adapter sets/clears
   `completedAt` and returns the task (shared contract suite covers both).
4. **`runOptimistic` gains `onSuccess?(result)`**; `useBoard.move`/`reorder` use it
   to `replaceTask` with the server's task.
   - Rationale: the server owns the timestamp; reflecting its response keeps the
     local task correct without a refetch.
   - Alternative: optimistically set `completedAt` locally — rejected: invents a
     client timestamp that may differ from the server's.

## Risks / Trade-offs

- [Contract/port change ripples to the in-memory adapter and tests] → the shared
  contract suite already exercises both adapters; add a `completedAt` parity case.
- [Existing tests expect `move`/`reorder` to return void] → update them.

## Migration Plan

No Flyway migration. Behavior/port change only.

## Test Strategy

- **Integration (backend, Postgres):** `CompletionApiIntegrationTest` — completing
  via the position endpoint sets `completedAt`; reordering out of Completed clears it.
- **Unit (frontend):** `taskRepository.contract.test.ts` asserts `completedAt`
  parity; `useBoard.test.ts` asserts the local task reflects the returned completion.
