# Tasks

## 1. Playwright configuration

- [x] 1.1 Create `frontend/playwright.config.ts` with `testDir: 'e2e'`, `snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}'`, and a chromium project; verify `npx playwright test --list` lists the specs.

## 2. Convert visual specs

- [x] 2.1 Replace each `page.screenshot({ path })` in `themes-visual.spec.ts` with `await expect(page).toHaveScreenshot([theme, name])` for `login`, `board-empty`, `board`, `modal`, `toast-error`; verify the file compiles with `npx playwright test --list`.
- [x] 2.2 Regenerate baselines: with Postgres/backend/frontend running, run `npx playwright test e2e/themes-visual.spec.ts --update-snapshots` and confirm the five PNGs per theme are updated.
- [x] 2.3 Re-run without update: `npx playwright test e2e/themes-visual.spec.ts` and confirm all comparisons pass (depends on 1.1, 2.1, 2.2).

## 3. Verify

- [x] 3.1 Run the full E2E suite with the stack up: `npx playwright test e2e`; confirm all specs pass (depends on group 2).
