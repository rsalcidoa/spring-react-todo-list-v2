# Tasks

Cross-tier bug fix. Each functional task starts with a failing test (TDD red) and
ends with a verification command.

## 1. Completion timestamp on the ordering path (backend)

- [x] 1.1 (red) Extend `backend/src/test/java/com/example/todo/CompletionApiIntegrationTest.java`: reordering a task to the Completed column (`PATCH /v1/tasks/{id}/position`) sets `completedAt`; reordering it back to Pending clears it; run `mvn test -Dtest=CompletionApiIntegrationTest` (red). Skills: `tdd`. *(depends on: none)*
- [x] 1.2 Move `applyCompletionTimestamp` into `backend/.../service/TaskAccess.java`, call it from `TaskService` and from `TaskOrderingService.reorder` (capturing the previous status); verify 1.1 passes (green). Skills: `codebase-design`. *(depends on: 1.1)*

## 2. Reflect the returned task on the board (frontend)

- [x] 2.1 (red) Update `frontend/src/data/TaskRepository.ts` types and tests so `move`/`reorder` return the updated `Task`; extend `taskRepository.contract.test.ts` with a `completedAt` parity case and `useBoard.test.ts` with "reflects the completion date after a move"; run `npx vitest run src/__tests__/taskRepository.contract.test.ts src/__tests__/useBoard.test.ts` (red). Skills: `tdd`. *(depends on: 1.2)*
- [x] 2.2 Return the task from `move`/`reorder` in the HTTP and in-memory adapters (in-memory maintains `completedAt` on create/update/move/reorder), add `onSuccess` to `runOptimistic`, and use it in `useBoard.move`/`reorder`; verify 2.1 passes (green). Skills: `frontend-design`. *(depends on: 2.1)*

## 3. Integration verification

- [x] 3.1 Run `mvn test`, `npm run build`, `npx vitest run` and `npx playwright test e2e` (all green; baselines unchanged); run `openspec validate fix-completion-date-on-drag --strict`. Skills: `code-review`. *(depends on: 2.2)*
