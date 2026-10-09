# Tasks

Cross-tier change (backend + frontend). Each functional task starts with a failing
test (TDD red) and ends with a verification command.

## 1. Record the completion timestamp (backend)

- [x] 1.1 (red) Add `backend/src/test/java/com/example/todo/CompletionApiIntegrationTest.java` asserting: completing a task sets a non-null `completedAt`; reopening to `PENDING`/`ACTIVE` clears it; a never-completed task is null; re-saving a completed task keeps it; run `mvn test -Dtest=CompletionApiIntegrationTest` (red). Skills: `tdd`. *(depends on: none)*
- [x] 1.2 Add `completedAt` to `backend/.../model/Task.java` + migration `V13__add_task_completed_at.sql`, set/clear it in `TaskService` (`applyCompletionTimestamp`), and expose it in `TaskResponse`; verify 1.1 passes (green). Skills: `codebase-design`. *(depends on: 1.1)*

## 2. Show the completion date (frontend)

- [x] 2.1 (red) Extend `frontend/src/__tests__/taskPresentation.test.ts` (`completedLabel` present when completed + `completedAt`, absent otherwise) and `frontend/src/__tests__/KanbanCard.test.tsx` (renders the completion date; a completed overdue task shows both "Vencida" and the completion date); run `npx vitest run src/__tests__/taskPresentation.test.ts src/__tests__/KanbanCard.test.tsx` (red). Skills: `tdd`. *(depends on: 1.2)*
- [x] 2.2 Add `completedAt` to `frontend/src/services/types/task.ts` and map it in `frontend/src/data/TaskRepository.ts`; add `completedLabel` in `frontend/src/services/taskPresentation.ts`; render it in `frontend/src/components/KanbanCard.tsx` / `.module.css`; add the `task.completedOn` key to `i18n/es.ts` and `en.ts`; verify 2.1 passes (green). Skills: `frontend-design`. *(depends on: 2.1)*

## 3. Integration verification

- [x] 3.1 Run `mvn test`, `npm run build`, `npx vitest run` and `npx playwright test e2e` (all green; refresh baselines only if a diff appears); run `openspec validate add-task-completion-date --strict`. Skills: `code-review`. *(depends on: 2.2)*
