# Design

## Context

See `proposal.md` — Why. Playwright is already a dependency; there is no config file, so `toHaveScreenshot` would default to a path/name scheme that does not match the tracked `e2e/__screenshots__/<theme>/` files. Baselines were previously produced by `page.screenshot()`, so they must be regenerated once under the assertion engine.

## Goals / Non-Goals

**Goals:**
- Visual assertions compare against tracked baselines for the `ink`, `phosphor`, and `nord` themes.
- Keep the existing baseline directory layout so diffs are reviewable in git.

**Non-Goals:**
- Cross-browser or cross-OS baselines (only chromium here).
- Wiring Playwright into CI.

## Decisions

1. **`snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}'`** with `expect(page).toHaveScreenshot([theme, name])` (chosen).
   - Rationale: reproduces the existing `ink/login.png` paths from the test data.
   - Alternative: default template — rejected: it does not map to the committed layout and would duplicate baselines.
2. **Regenerate baselines once with `--update-snapshots`** (chosen).
   - Rationale: assertions need engine-consistent references; the old dumps are not comparison baselines.
   - Alternative: keep both capture and assertion paths — rejected as duplicate/confusing.
3. **Leave `visual-baseline.spec.ts` as a manual capture helper** (writes to `/tmp/shots-before`).
   - Rationale: it exists for ad-hoc before/after diffing, not as a regression gate; converting it would duplicate `themes-visual`.

## Risks / Trade-offs

- [Font/antialiasing differences between machines] → document that baselines are environment-specific; regenerate on the canonical machine.
- [Animations/async cause flakiness] → `toHaveScreenshot` disables animations by default; keep the existing readiness assertions before capture.

## Test Strategy

- E2E (Playwright): `npx playwright test e2e/themes-visual.spec.ts` compares against baselines.
- One-time generation: `npx playwright test e2e/themes-visual.spec.ts --update-snapshots`.
- Regression: full `npx playwright test e2e` with the stack running.
