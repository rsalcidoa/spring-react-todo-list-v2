# Tasks

> Skills: `tdd`; `frontend-design`.

## 1. User menu

- [x] 1.1 (red) `UserMenu.test.tsx`: renders the initial and tooltip from the email; opening shows the email and triggers logout. Verify red.
- [x] 1.2 Implement `UserMenu` (+ CSS) and wire it into the board header, removing the standalone logout button. Verify `npx vitest run src/__tests__/UserMenu.test.tsx src/__tests__/TodoListPage.test.tsx` green. Skills: `tdd`, `frontend-design`.

## 2. Verify

- [x] 2.1 `npm test -- --run` and `npm run build`; confirm green. Refresh the affected visual baselines with `npx playwright test --update-snapshots` and review the diff.
