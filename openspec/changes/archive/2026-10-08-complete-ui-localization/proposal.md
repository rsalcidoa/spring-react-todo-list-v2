# Proposal — Complete the UI localization

## Why

REQ-FE-028 requires visible strings to render through the i18n layer, but the
board chrome and the auth pages still hardcode Spanish literals: column labels
(`Por hacer`, `En progreso`, `Hecho`), the header controls (`Buscar tareas`,
`Vista`, `Proyecto`, `Prioridad`, `Ordenar`, `Tema`, `Limpiar`, their options
and `aria-label`s), the delete `confirm`, the theme labels, and the
`Login`/`Register`/`ForgotPassword`/`ResetPassword` labels and links. Switching
to English leaves them in Spanish.

## What Changes

- Add typed keys to `es.ts`/`en.ts` for: board column labels, header controls
  and their options, filter aria-labels and the delete confirmation, theme
  labels, and the auth page labels/links.
- Replace the literals in `TodoListPage`, `LoginPage`, `RegisterPage`,
  `ForgotPasswordPage`, `ResetPasswordPage`, `AddTaskModal` and the theme labels.
- Keep the **Spanish defaults byte-identical** to today (so existing tests and
  Spanish visual baselines stay valid); English gets proper translations.

**Non-goals:** changing routes, API, layout or the set of controls; adding new
locales.

**Rollback plan:** revert the touched files; the UI returns to the current
mixed-language state. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: strengthens "UI Localization" to cover the board
  chrome and auth pages.

## Impact

- **Frontend (TS):** `frontend/src/i18n/{es,en}.ts`,
  `frontend/src/pages/{TodoListPage,LoginPage,RegisterPage,ForgotPasswordPage,ResetPasswordPage}.tsx`,
  `frontend/src/components/AddTaskModal.tsx`, `frontend/src/context/ThemeContext.tsx`
  (labels), tests.
