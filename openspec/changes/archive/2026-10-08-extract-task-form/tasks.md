# Tasks

> Skills: `tdd`; `codebase-design`.

## 1. Extract the form

- [x] 1.1 (red) `useTaskForm.test.ts`: parse recurrence/reminder/project, block blank title, and tag/subtask add/remove through the hook; verify red (module absent).
- [x] 1.2 Implement `useTaskForm` moving parsing/validation/sub-resource handlers out of `AddTaskModal`; verify `npx vitest run src/__tests__/useTaskForm.test.ts` green. Skills: `tdd`.
- [x] 1.3 Make `AddTaskModal` presentation over the hook and remove the page's tag/subtask proxying; verify `npx vitest run src/__tests__/AddTaskModal.test.tsx src/__tests__/TodoListPage.test.tsx` green.

## 2. Verify

- [x] 2.1 `npm test -- --run` and `npm run build`; confirm green.
