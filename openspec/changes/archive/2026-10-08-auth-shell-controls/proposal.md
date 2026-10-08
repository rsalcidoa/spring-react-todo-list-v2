# Proposal — Appearance and language controls on auth screens

## Why

The theme and language selectors only exist in the board header. Before login
the user cannot switch theme or locale, and the auth screens ignore the stored
preference for their own strings.

## What Changes

- Add a small shared `AppControls` component with a theme selector and a
  language selector (reusing `useTheme`/`useT`).
- Render it on the login, register, forgot-password and reset-password pages,
  positioned without disturbing their layout.
- The labels come from the localization change (this depends on those keys).

**Non-goals:** moving the controls out of the board header; new themes/locales;
changing auth behavior.

**Rollback plan:** remove `AppControls` from the auth pages. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds "Appearance and Language Controls on Auth Screens".

## Impact

- **Frontend (TS):** new `frontend/src/components/AppControls.tsx` (+ `.module.css`),
  `frontend/src/pages/{LoginPage,RegisterPage,ForgotPasswordPage,ResetPasswordPage}.tsx`,
  tests.
