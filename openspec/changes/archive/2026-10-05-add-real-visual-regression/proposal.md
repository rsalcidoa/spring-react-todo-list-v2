# Proposal

## Why

The "visual" E2E specs only call `page.screenshot(...)`; they never compare against a baseline, so every run "passes" and the `frontend-integration` scenarios about pixel-identity and theme baselines are unverified. A visual regression would be invisible.

## What Changes

- Add `frontend/playwright.config.ts` defining the `e2e` test dir and a `snapshotPathTemplate` that maps back to the existing `e2e/__screenshots__/` layout.
- Convert `themes-visual.spec.ts` from `page.screenshot()` to `expect(page).toHaveScreenshot([theme, name])` assertions for the three themes.
- Regenerate the tracked baselines once with `--update-snapshots`, then confirm the specs compare on a normal run.

**Non-goals:**
- No application UI change; no new theme.
- No CI pipeline (the repo has none); snapshots are asserted on demand with the stack running.

**Rollback plan:** revert the config and the spec conversion and restore the previous PNGs from git. No runtime impact.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. This changes how the existing `frontend-integration` visual scenario is verified, not the behavior it specifies; `skip_specs: true` is set.

## Impact

- **Frontend (TS):** new `frontend/playwright.config.ts`; `frontend/e2e/themes-visual.spec.ts`.
- **Baselines:** `frontend/e2e/__screenshots__/<theme>/*.png` regenerated.
- **API/runtime:** none.
