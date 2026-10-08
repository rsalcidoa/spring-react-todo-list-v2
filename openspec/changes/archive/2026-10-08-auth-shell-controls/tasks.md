# Tasks

> Skills: `tdd`; `frontend-design`.

## 1. Shared controls

- [x] 1.1 (red) `AppControls.test.tsx`: renders theme and language selectors, changes persist. Verify red.
- [x] 1.2 Implement `AppControls` (+ CSS) and mount it on the four auth pages; verify `npx vitest run src/__tests__/AppControls.test.tsx src/__tests__/LoginPage.test.tsx` green. Skills: `tdd`, `frontend-design`.

## 2. Verify

- [x] 2.1 `npm test -- --run` and `npm run build`; confirm green. Refresh the login visual baselines with `npx playwright test --update-snapshots` and review the diff.
