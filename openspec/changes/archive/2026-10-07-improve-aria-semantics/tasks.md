# Tasks

> Skills: `tdd` in the functional task; `frontend-design` for the toast markup.

## 1. Accessible status (TDD)

- [x] 1.1 (red) Extend `TodoListPage.test.tsx` to fail: after deleting, a non-interactive `role="status"` announces the deletion, the undo button receives focus, and it is not removed while focused; verify `npx vitest run src/__tests__/TodoListPage.test.tsx` (red). Skills: `tdd`.
- [x] 1.2 Split the announcement from the control: add a visually-hidden `.srOnly` live region, render the undo button outside it, focus it on appearance, and pause the dismiss timer while focused; add `aria-busy` while loading; verify `npx vitest run src/__tests__/TodoListPage.test.tsx` (green). Skills: `tdd`, `frontend-design`.

## 2. Verify

- [x] 2.1 `npm test -- --run` and `npm run build`; confirm green (depends on 1).
