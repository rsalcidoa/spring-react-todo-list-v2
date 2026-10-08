# Tasks

> Skills: `tdd`; `frontend-design`.

## 1. Scope selection

- [x] 1.1 (red) `useBoard.test.ts` / `boardQuery.test.ts`: `'none'` filters to tasks without a project; `''` shows all; an id filters to that project. Verify red.
- [x] 1.2 Support `'none'` in `applyFilters`/`BoardQuery` and expose the scope; verify green.
- [x] 1.3 `TodoListPage`: switcher options (Todos/Sin proyecto/projects/＋ New project…), scope title + project description subtitle (replacing "Tablero"), and preselect the active project in the task modal. Verify `npx vitest run src/__tests__/TodoListPage.test.tsx` green.
- [x] 1.4 Add i18n keys (`board.scope.all`, `board.scope.none`, …).

## 2. Verify

- [x] 2.1 `npm test -- --run` and `npm run build`; confirm green. Refresh the affected visual baselines with the stack up and review the diff.
