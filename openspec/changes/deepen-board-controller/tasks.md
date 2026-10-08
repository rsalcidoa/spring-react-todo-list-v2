# Tasks

> Skills: `tdd`; `codebase-design` for the seam.

## 1. Characterize then extract

- [ ] 1.1 (red) Write `useBoard.test.ts` using `InMemoryTaskRepository` asserting: optimistic `move` then rollback on failure, `undo` restores, and `loadMore` appends — through the hook interface; verify it fails (module absent).
- [ ] 1.2 Implement `useBoard` moving optimistic+rollback (`applyOptimistic`), undo lifecycle, debounce and pagination from the page; verify `npx vitest run src/__tests__/useBoard.test.ts` (green). Skills: `tdd`, `codebase-design`.
- [ ] 1.3 Rewire `TodoListPage` to render from `useBoard`; fold `boardView`/`taskOrdering`/`boardKeyboard` in as private helpers; verify `npx vitest run src/__tests__/TodoListPage.test.tsx` stays green.

## 2. Verify

- [ ] 2.1 `npm test -- --run` and `npm run build`; confirm green.
