# Proposal

## Why

Verification of the main specs found ~30 scenarios with no dedicated test, so several spec guarantees (status defaults, response fields, error bodies, tag lifecycle, auth edge cases) are unverifiable and regressions would pass silently. The E2E full-flow test also claims tag coverage it never exercises.

## What Changes

- Add backend integration/unit tests for the uncovered spec scenarios (status default/explicit, GET fields, status filters, PUT status, blank titles, auth edge cases, priority, tag size/unassign/isolation, rollback).
- Add frontend unit/component tests for the uncovered scenarios (auth header, empty-column text, email validation at page level, HTML5 `required`, navigation links, reset navigation, link hrefs, single-banner replacement).
- Fix `frontend/e2e/full-flow.spec.ts` to target the Spanish tag input and assert the tag appears.

**Non-goals:**
- No production behavior changes; only test code (and the E2E test) is touched.
- No new test frameworks or dependencies.

**Rollback plan:** revert the added/changed test files. No application code or data is affected.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. This change only adds tests that assert existing spec behavior; `skip_specs: true` is set.

## Impact

- **Backend tests (Java):** `ErrorContractIntegrationTest`, `TaskCrudIntegrationTest`, `TagResolutionIntegrationTest`, `OwnershipApiIntegrationTest`, `TagApiIntegrationTest`.
- **Frontend tests (TS):** `TodoListPage.test.tsx`, `LoginPage.test.tsx`, `RegisterPage.test.tsx`, `ResetPasswordPage.test.tsx`, `ForgotPasswordPage.test.tsx`, `session`/`ApiService` tests.
- **E2E (TS):** `frontend/e2e/full-flow.spec.ts`.
- **API/runtime:** none.
