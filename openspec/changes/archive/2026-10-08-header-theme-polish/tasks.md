# Tasks

> Skills: `tdd`; `frontend-design`.

## 1. Token + controls contrast

- [x] 1.1 Define `--color-surface-raised` in `styles/theme.css` and in `themes/{ink,phosphor,nord}.css`; use it in `AppControls.module.css` with a readable text color, and make the `UserMenu` avatar accent-filled (`--color-primary` / `--color-on-primary`).
- [x] 1.2 `AppControls.test.tsx` / `UserMenu.test.tsx`: assert the selectors/avatar render with the raised/accent classes (keep DOM behavior green). Verify `npx vitest run src/__tests__/AppControls.test.tsx src/__tests__/UserMenu.test.tsx` green.

## 2. Header layout

- [x] 2.1 (red) `TodoListPage.test.tsx`: the "New task" button lives in the actions group, separated from the filter controls. Verify red.
- [x] 2.2 Split the header into an actions group (New task primary + usermenu) and a filters group; style accordingly. Verify green. Skills: `frontend-design`.

## 3. Verify

- [x] 3.1 `npm test -- --run` and `npm run build`; confirm green. Refresh the affected visual baselines with the stack up (`npx playwright test --update-snapshots`) and review the diff.
