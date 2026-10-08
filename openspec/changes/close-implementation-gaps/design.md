# Design

## Context

See `proposal.md` — Why. The gaps are test/tooling/doc items found by verifying the 13 roadmap changes. No new modules.

## Decisions

1. **`tsc --noEmit` in the build** (`package.json`: `"build": "tsc --noEmit && vite build"`). Rationale: `vite build` uses esbuild without typechecking, so typed i18n keys are not enforced. Alternative: a separate `typecheck` script — rejected because it would not gate the build.
2. **Scenario tests added to the existing integration test classes** rather than new suites. Rationale: mirrors the capability grouping.
3. **Responsive spec aligned to reality**: the requirement/scenario is reworded so the `@media` literals must match the documented tokens; CSS `var()` in media queries is not possible without preprocessing.
4. **Quick-add-on-empty-board recorded as a non-goal** in `add-quick-add-and-keyboard/design.md` (the empty state already offers the create CTA).

## Risks / Trade-offs

- [Adding `tsc --noEmit` may surface pre-existing type errors] -> run it once; fix any that are real, and keep the change scoped.
- [Tests are additive] -> low risk.

## Test Strategy

- Backend scenario tests via MockMvc; frontend via Vitest and one Playwright reorder case.
- Final gate: `mvn test`, `npm run build`, `npm test -- --run`, `npx playwright test` with Postgres up.
