# Design

## Context

See `proposal.md` — Why. Today the taxonomy lives in `data/TaskRepository.ts`
(`RepositoryError`, `mapApiError`, `getApiStatus`, `getApiMessage`,
`toDisplayMessage`) and is consumed inconsistently: `RegisterPage` reads the raw
axios shape, `ResetPasswordPage` string-matches a detail, `ManageProjectsModal`
and `useBoard` call `toDisplayMessage`, and `useTaskForm` wraps it through
`useTagErrorText`. A `'Error'` sentinel is compared in `errorMessages.ts`,
`RegisterPage` and `ResetPasswordPage`. ADR-0006 fixes the backend contract;
this change completes the frontend side of it.

## Goals / Non-Goals

**Goals:**
- One interface a caller uses for every error → message mapping.
- Localized, taxonomy-aligned messages with no placeholder sentinel.
- Preserve surfacing of genuine unexpected details (network/programming errors).

**Non-Goals:**
- Rendering field-level `{error, errors}` bodies beyond today's behavior.
- Touching the backend taxonomy or `ErrorBanner`.
- A generic toast/notification module.

## Decisions

1. **New presentation module `services/errorPresenter.ts`** with a small
   interface: `presentError(error, t, options?)`, `errorCode(error)`,
   `errorDetail(error)`.
   - Rationale: presentation (localization + fallbacks) is a different concern
     from transport parsing; it deserves one module.
   - Alternative: keep `toDisplayMessage` in the data module — rejected: mixes
     i18n into the data seam and leaves call sites to add their own fallbacks.
2. **Precedence: per-code override → (unknown only) detail → fallback → localized
   per-code default.** `options = { override?, fallback? }`.
   - Rationale: features keep their domain wording (`auth.register.duplicate`,
     `tagError.*`) while the module owns the generic mapping; unexpected details
     still surface.
   - Alternative: backend detail first — rejected: leaks unlocalized English.
3. **`RepositoryError` carries `detail?: string`** (backend `{error}` or the
   `Error.message`); `getApiMessage` stops returning the `'Error'` sentinel and
   the raw extractors stop being exported. `mapApiError` stays the transport→code
   step in the data module.
   - Rationale: the sentinel was the smell; absence is now represented as
     `undefined` and the presenter decides the text.
4. **`toDisplayMessage` is removed**; its behavior moves into `presentError`.
   `useTagErrorText` becomes a thin `presentError` call with tag overrides.
5. **The Board controller localizes its action prefixes.** `useBoard` uses
   `useT()` and composes `t('board.error.move')` + `: ` + `presentError(e, t)`,
   so the detail is preserved and the prefix is localized.
6. **Reset's expired-token case stays a domain check** via `errorDetail(error)`,
   because the backend signals it with a message, not a distinct status.

## Risks / Trade-offs

- [Known codes now show the localized default instead of the raw backend string]
  → intended; tests that asserted a backend string are updated to the localized
  text (register keeps the same wording via its override).
- [Removing `toDisplayMessage` / exported extractors breaks imports] → update the
  tests and call sites in the same change; TypeScript build catches stragglers.
- [Hardcoded Spanish prefixes in `useBoard`] → replaced with `board.error.*`
  keys, keeping the existing message shape so Board tests still match.

## Migration Plan

Frontend-only; no data or API migration. Build with `npm run build`. Rollback
restores `toDisplayMessage`/`getApiMessage` and the call-site logic.

## Test Strategy

- **Unit (Vitest):** `errorPresenter.test.ts` for precedence, overrides, unknown
  detail, no-sentinel and localization; `TaskRepository.test.ts` keeps the
  taxonomy assertions and drops the `toDisplayMessage` ones.
- **Component (Vitest):** Register/Reset/ManageProjects/useTaskForm/useBoard
  message assertions stay green (register conflict wording unchanged).
- **E2E (Playwright):** the toast-error baseline is unaffected (no UI change);
  run the suite to confirm.
- **Backend:** none.
