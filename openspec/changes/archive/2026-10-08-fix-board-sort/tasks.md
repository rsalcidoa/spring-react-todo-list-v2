# Tasks

> Skills: `tdd`; `codebase-design`.

## 1. Sort within columns

- [x] 1.1 (red) `useBoard.test.ts`: with a field sort active, `grouped` orders each column by the field (dateless last for `dueDate`); with `Manual`, by `position`. Verify red.
- [x] 1.2 Pass `sort`/`dir` through `applyFilters` into the per-column ordering; add the `Manual` default. Verify `npx vitest run src/__tests__/useBoard.test.ts src/__tests__/boardQuery.test.ts` green. Skills: `tdd`.
- [x] 1.3 Update `TodoListPage` sort options (`Manual` default) and disable drag on `KanbanColumn`/`KanbanCard` while a field sort is active; verify `npx vitest run src/__tests__/TodoListPage.test.tsx` green.

## 2. Verify

- [x] 2.1 `npm test -- --run` and `npm run build`; confirm green.
