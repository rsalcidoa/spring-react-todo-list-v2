# Tasks

> Skills: `tdd`; `frontend-design`.

## 1. Completed treatment

- [x] 1.1 (red) `KanbanCard`/`TodoListPage`: a completed card carries the struck-through/muted treatment. Verify red.
- [x] 1.2 Apply the completed class + tokens in `KanbanCard`; verify green. Skills: `tdd`, `frontend-design`.

## 2. Inline errors clear on edit

- [x] 2.1 (red) `QuickAddTask.test.tsx` and `useTaskForm.test.ts`: typing clears the inline error. Verify red.
- [x] 2.2 Clear the error on change in `QuickAddTask` and the title error in `useTaskForm`; verify the tests green.

## 3. Verify

- [x] 3.1 `npm test -- --run` and `npm run build`; confirm green. Refresh the affected visual baselines with `npx playwright test --update-snapshots` and review the diff.
