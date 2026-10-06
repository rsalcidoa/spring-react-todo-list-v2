# Proposal

## Why

All UI strings are hardcoded in Spanish. The app cannot be shared with English-speaking users and cannot grow beyond one locale. Block F (alcance): make the UI translatable without a heavy dependency.

## What Changes

- Add a lightweight, zero-dependency i18n layer under `frontend/src/i18n/`: typed keys, `es` and `en` locale files, an `I18nProvider` + `useT()` hook, a language selector, browser-language detection on first run, and persistence in `localStorage`.
- Migrate UI strings in pages and components from literals to `t('key')` in phases (auth pages, board, modals/errors).
- API errors: map the known HTTP outcomes to localized messages on the frontend, keeping the backend message as a detail fallback.

**Non-goals:**
- Localizing backend-generated messages at the source (the backend keeps its current Spanish contract messages for now).
- Server-side locale negotiation (`Accept-Language`), RTL, or machine translation.

**Rollback plan:** remove the provider/selector and restore the literals. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds a "Localization" requirement.

## Impact

- **Frontend (TS):** new `frontend/src/i18n/` (context, `es.ts`, `en.ts`, typed keys); `frontend/src/pages/*`, `frontend/src/components/*`, `frontend/src/App.tsx` (provider), a language selector.
- **API/Backend:** none.
