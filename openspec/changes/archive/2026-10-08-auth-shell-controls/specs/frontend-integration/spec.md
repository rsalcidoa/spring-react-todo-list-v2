# Spec Delta

## ADDED Requirements

### Requirement: Appearance and Language Controls on Auth Screens
The login, register, forgot-password and reset-password screens SHALL offer a
theme selector and a language selector, sharing the same persisted preferences
as the board. Changing either SHALL apply immediately and persist across
reloads.

**ID**: REQ-FE-034
**Affected files**:
- `frontend/src/components/AppControls.tsx` — theme + language selectors
- `frontend/src/pages/LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` — render the control

#### Scenario: Change theme before login
- **WHEN** the user selects a different theme on the login screen
- **THEN** the theme applies immediately and persists across reloads

#### Scenario: Change language before login
- **WHEN** the user selects English on the login screen
- **THEN** the auth screen strings render in English and the choice persists
