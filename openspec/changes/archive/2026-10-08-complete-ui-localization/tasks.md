# Tasks

> Skills: `tdd`.

## 1. Dictionary + board chrome

- [x] 1.1 (red) Extend `i18n.test.tsx` / `TodoListPage.test.tsx`: switching to English renders the column labels, header controls and options in English. Verify red.
- [x] 1.2 Add the new keys to `src/i18n/{es,en}.ts` (Spanish defaults unchanged) and replace the board-chrome literals in `TodoListPage.tsx`. Verify `npx vitest run src/__tests__/i18n.test.tsx src/__tests__/TodoListPage.test.tsx` green.
- [x] 1.3 Replace the auth-page and modal literals (`LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `AddTaskModal`) and the theme labels; verify the same tests stay green.

## 2. Verify

- [x] 2.1 `npm test -- --run` and `npm run build`; confirm green.
