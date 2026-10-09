# Spec Delta

## ADDED Requirements

### Requirement: Unified Localized Error Messages
The frontend SHALL map any thrown value to a user-facing message through a single
presentation module that reads the error taxonomy (`RepositoryErrorCode`). The
module SHALL prefer a per-code override, then a localized default for the code,
and for an unmapped (`unknown`) error SHALL surface the underlying detail when
present. The module SHALL NOT invent a placeholder message (no `'Error'`
sentinel), and SHALL NOT require call sites to inspect HTTP status or raw
transport shapes. User-facing error strings SHALL come from the active locale.

**ID**: REQ-FE-043
**Affected files**:
- `frontend/src/services/errorPresenter.ts` — the presentation module
- `frontend/src/data/TaskRepository.ts` — `RepositoryError` exposes `code`/`status`/`detail`
- `frontend/src/i18n/es.ts`, `frontend/src/i18n/en.ts` — `error.*` keys
- `frontend/src/pages/RegisterPage.tsx`, `frontend/src/pages/ResetPasswordPage.tsx`,
  `frontend/src/components/ManageProjectsModal.tsx`,
  `frontend/src/components/useTaskForm.ts`, `frontend/src/pages/useBoard.ts`

#### Scenario: A coded error uses the localized default
- **WHEN** a request fails with 409 Conflict and no override is supplied
- **THEN** the message is the localized default for `conflict`, not the raw backend string

#### Scenario: A domain override wins over the default
- **WHEN** the register page maps a 409 to its "already registered" override
- **THEN** the override text is shown

#### Scenario: An unmapped error surfaces its detail
- **WHEN** an unexpected error with a message (for example `Network down`) is presented
- **THEN** the underlying detail is shown instead of a generic placeholder

#### Scenario: No placeholder sentinel is produced
- **WHEN** an error carries no backend detail and no override
- **THEN** the localized default for its code is shown (never a bare `'Error'`)

#### Scenario: Messages follow the active locale
- **WHEN** the locale is English
- **THEN** coded error messages render in English
