# Tasks

Frontend bug fix; no backend tasks. Each task ends with a verification command.
Run frontend commands from `frontend/`.

## 1. Stable drag-over highlight (frontend)

- [x] 1.1 (red) Extend `frontend/src/__tests__/TodoListPage.test.tsx` with a case that fires `dragEnter` on a child of the column body followed by `dragLeave` on the body and asserts the `dragover` highlight stays; run `npx vitest run src/__tests__/TodoListPage.test.tsx` (red). Skills: `tdd`. *(depends on: none)*
- [x] 1.2 Track a `dragDepth` counter in `frontend/src/components/KanbanColumn.tsx` (`dragenter` +1, `dragleave` -1 clearing at zero, `dragover` reinforces, `drop` resets) and assert the existing drag-over/drop cases still pass; verify 1.1 passes (green). Skills: `frontend-design`. *(depends on: 1.1)*

## 2. Integration verification

- [x] 2.1 Run `npm run build` and `npx vitest run` (green), then `npx playwright test e2e` with the stack up (green; baselines unchanged); run `openspec validate fix-column-drag-highlight --strict`. Skills: `code-review`. *(depends on: 1.2)*
