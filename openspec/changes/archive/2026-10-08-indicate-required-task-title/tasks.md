# Tasks

Frontend UX fix; no backend tasks. Each task starts with a failing test (TDD red)
and ends with a verification command. Run frontend commands from `frontend/`.

## 1. Required-field indication (frontend)

- [x] 1.1 (red) Update `frontend/src/__tests__/AddTaskModal.test.tsx` (Save is disabled with a blank title and enabled once typed; a blank Subtask shows a message) and `frontend/src/__tests__/ManageProjectsModal.test.tsx` (a blank name shows a message); run `npx vitest run src/__tests__/AddTaskModal.test.tsx src/__tests__/ManageProjectsModal.test.tsx` (red). Skills: `tdd`. *(depends on: none)*
- [x] 1.2 Disable Save while the title is blank (`AddTaskModal.tsx`/`.module.css`), add `subtaskError` to `useTaskForm.ts` and render it, add `nameError` to `ManageProjectsModal.tsx`/`.module.css`, and add the `task.subtaskRequired` / `project.nameRequired` keys to `i18n/es.ts` and `en.ts`; verify 1.1 passes (green). Skills: `frontend-design`. *(depends on: 1.1)*

## 2. Integration verification

- [x] 2.1 Run `npm run build` and `npx vitest run` (green), then `npx playwright test e2e` with the stack up (green; baselines unchanged); run `openspec validate indicate-required-task-title --strict`. Skills: `code-review`. *(depends on: 1.2)*
