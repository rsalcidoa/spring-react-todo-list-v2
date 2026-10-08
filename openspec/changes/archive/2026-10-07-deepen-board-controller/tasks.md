# Tasks

> Skills: `tdd`; `codebase-design` for the seam.

## 1. Characterize then extract

- [x] 1.1 (red) Write `useBoard.test.ts` using `InMemoryTaskRepository` asserting: optimistic `move` then rollback on failure, `undo` restores, and `loadMore` appends — through the hook interface; verify it fails (module absent).
- [x] 1.2 Implement `useBoard` moving optimistic+rollback (`applyOptimistic`), undo lifecycle, debounce and pagination from the page; verify `npx vitest run src/__tests__/useBoard.test.ts` (green). Skills: `tdd`, `codebase-design`.
- [x] 1.3 Rewire `TodoListPage` to render from `useBoard`; keep `boardView`/`taskOrdering`/`boardKeyboard` as modules consumed by `useBoard` (their merge into `boardInteraction` is C7, and their tests stay green); verify `npx vitest run src/__tests__/TodoListPage.test.tsx` stays green.

## 2. Verify

- [x] 2.1 `npm test -- --run` and `npm run build`; confirm green.
