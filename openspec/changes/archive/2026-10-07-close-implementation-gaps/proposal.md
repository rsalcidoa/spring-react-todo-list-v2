# Proposal

## Why

Verification of the 13 roadmap changes found one spec/tooling gap and several scenarios without test coverage, plus minor cleanup. This change closes them so the changes are archive-ready.

## What Changes

- **Tooling (W3):** make `npm run build` typecheck first (`tsc --noEmit`) so a missing i18n key is a real compile error.
- **Test coverage (W4–W8):** add the missing scenario tests: project cross-user 403, subtask foreign parent, restore ownership, manual drag-within-column, and recurring reminder shift.
- **Spec wording (W1):** align the `add-responsive-layout` delta spec with reality — `@media` uses literal values that match the tokens (CSS cannot use `var()` in media queries).
- **Cleanup (S2–S4):** remove unused `LoginResponse` and the dead `handleDrop`, and document quick-add-on-empty-board as a non-goal (S1); review `role="status"` usage (S4).

**Non-goals:**
- No behavior changes beyond the build typecheck; no new features.

**Rollback plan:** revert the test/build/cleanup commits. The build script change is trivially reversible.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. This is test/tooling/doc cleanup plus an edit to an existing *active* change's artifacts; no main-spec behavior changes, so `skip_specs: true`.

## Impact

- **Backend tests (Java):** `ProjectApiIntegrationTest`, `SubtaskApiIntegrationTest`, `TaskRecoveryIntegrationTest`, `RecurringApiIntegrationTest`.
- **Frontend:** `frontend/package.json` (build script), `frontend/src/__tests__/TodoListPage.test.tsx`, `frontend/src/pages/TodoListPage.tsx` (dead code), E2E ordering.
- **Backend cleanup (Java):** `dto/LoginResponse.java`, `controller/AuthController.java`.
- **Docs:** `openspec/changes/add-responsive-layout/{specs,design}` and `openspec/changes/add-quick-add-and-keyboard/design.md`.
