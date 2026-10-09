# Tasks

Frontend + docs change; there are no backend tasks. Each functional task starts
with a failing test (TDD red) and ends with a verification command. Run the
frontend commands from `frontend/`.

## 1. Shortcuts dialog (frontend)

- [x] 1.1 (red) Add `frontend/src/__tests__/ShortcutsModal.test.tsx` asserting the dialog lists the shortcuts (focus, `Enter` edit, `Alt+Arrow` move, `Esc` close, quick-add) and closes on `Esc` and on overlay click; run `npx vitest run src/__tests__/ShortcutsModal.test.tsx` (red). Skills: `tdd`. *(depends on: none)*
- [x] 1.2 Add the shortcut keys to `frontend/src/i18n/es.ts` and `frontend/src/i18n/en.ts`, then implement `frontend/src/components/ShortcutsModal.tsx` and `ShortcutsModal.module.css` (`role="dialog"`, `aria-modal`, `Esc` + overlay close, focus on open); verify 1.1 passes (green). Skills: `frontend-design`. *(depends on: 1.1)*

## 2. Footer help trigger (frontend)

- [x] 2.1 (red) Extend `frontend/src/__tests__/AppFooter.test.tsx` to assert the help control is present and opens the shortcuts dialog with its content; run `npx vitest run src/__tests__/AppFooter.test.tsx` (red). Skills: `tdd`. *(depends on: 1.2)*
- [x] 2.2 Wire the trigger and dialog state into `frontend/src/components/AppFooter.tsx`, placing the control in the right cluster so it stays visible on small screens in `AppFooter.module.css`; verify 2.1 passes (green). Skills: `frontend-design`. *(depends on: 2.1)*

## 3. Documentation

- [x] 3.1 Add a "Keyboard shortcuts" section to `README.md` listing the shortcuts, and verify each entry matches the dialog list from task 1.2. *(depends on: 1.2)*

## 4. Visual baselines and integration verification

- [x] 4.1 Refresh and review the board visual baselines (footer changed) and the responsive mobile baseline; run `npx playwright test e2e/themes-visual.spec.ts e2e/responsive.spec.ts --update-snapshots`, inspect each diff, then re-run without `--update-snapshots` (green). Skills: `frontend-design`. *(depends on: 2.2)*
- [x] 4.2 Run `npm run build` and `npx vitest run` (green), then `npx playwright test e2e` with the stack up (green). Skills: `code-review`. *(depends on: 4.1)*
