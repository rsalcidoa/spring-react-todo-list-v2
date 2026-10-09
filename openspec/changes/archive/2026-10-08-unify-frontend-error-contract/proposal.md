# Proposal

## Why

The backend has one error contract (ADR-0006: `{error}` / `{error, errors}`), but
the frontend interprets it in four overlapping places and leaks raw, unlocalized
backend strings into the UI. Call sites re-map the same transport error by hand,
a `'Error'` string sentinel is compared in three files, and mutation errors in
the Board controller are hardcoded in Spanish. Recent UI work keeps touching
these call sites.

## What Changes

- **One presentation module for errors.** A new deep module (`presentError`)
  maps any thrown value to a localized message through the error taxonomy, with
  per-code overrides for domain cases. Call sites cross this one interface.
- **Remove the `'Error'` sentinel.** The transport extractor no longer invents a
  default message; absence of a backend detail is represented explicitly.
- **Localize call sites.** `RegisterPage`, `ResetPasswordPage`,
  `ManageProjectsModal`, `useTaskForm` and the Board controller stop re-mapping
  and stop embedding hardcoded user text; the Board's action-failure messages
  become i18n keys.
- **Keep behavior for unexpected errors.** An unmapped (`unknown`) error still
  surfaces its detail, so genuine network/programming messages are not swallowed.

**Non-goals**:
- No backend or API changes; the server error contract (ADR-0006) is untouched.
- No new error UI (the `ErrorBanner` toast stays).
- No field-level `{error, errors}` rendering beyond what exists today.

**Scope**: `frontend/src` only.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `frontend-integration`: a new "Unified Localized Error Messages" requirement
  (REQ-FE-043) is added.

## Impact

Affected frontend files:
- `frontend/src/services/errorPresenter.ts` (new) — the presentation module.
- `frontend/src/data/TaskRepository.ts` — `RepositoryError` gains a `detail`,
  the `'Error'` default is removed, `getApiStatus`/`getApiMessage` stop being the
  public surface.
- `frontend/src/services/errorMessages.ts` — `useTagErrorText` uses the module.
- `frontend/src/i18n/es.ts`, `frontend/src/i18n/en.ts` — `error.*` keys.
- Call sites: `pages/RegisterPage.tsx`, `pages/ResetPasswordPage.tsx`,
  `components/ManageProjectsModal.tsx`, `components/useTaskForm.ts`,
  `pages/useBoard.ts`.
- Tests: `TaskRepository.test.ts` (taxonomy), a new `errorPresenter.test.ts`,
  and the call-site tests that assert messages.

No API, dependency, or backend impact. Aligns with the frontend convention of a
single `error` state per page and with ADR-0006.

**Rollback plan**: restore the previous `toDisplayMessage`/`getApiMessage` and
the call-site logic; no data or API migration.

> This is the first of five architectural deepenings (see the architecture
> review). It is the foundation for the optimistic-update module, which will
> delegate its error text to this module.
