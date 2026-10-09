# Tasks

Frontend bug fix; no backend tasks. Each task ends with a verification command.
Run frontend commands from `frontend/`.

## 1. Bound the task dialog (frontend)

- [x] 1.1 (red) Add `frontend/e2e/modal-overflow.spec.ts`: register, create a task, create ~15 Subtasks through the API using the stored `jwt`, open the task's edit dialog and assert the Save button is within the viewport; run `npx playwright test e2e/modal-overflow.spec.ts` with the stack up (red). Skills: `tdd`. *(depends on: none)*
- [x] 1.2 Make `.modal` a flex column with `max-height: 90vh`, wrap the fields in a scrollable `.modalBody` and pin `.actions` in `frontend/src/components/AddTaskModal.tsx` / `AddTaskModal.module.css` (mobile keeps `height:100vh`); verify 1.1 passes (green). Skills: `frontend-design`. *(depends on: 1.1)*

## 2. Integration verification

- [x] 2.1 Run `npm run build` and `npx vitest run` (green), then `npx playwright test e2e` with the stack up (green; refresh the modal baseline only if it changed); run `openspec validate fix-task-modal-overflow --strict`. Skills: `code-review`. *(depends on: 1.2)*
