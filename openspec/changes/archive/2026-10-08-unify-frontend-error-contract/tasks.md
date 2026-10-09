# Tasks

Frontend-only change; there are no backend tasks. Each functional task starts
with a failing test (TDD red) and ends with a verification command. Run the
frontend commands from `frontend/`.

## 1. The error presentation module (frontend)

- [x] 1.1 (red) Add `frontend/src/__tests__/errorPresenter.test.ts` asserting: a coded error uses the localized default; an override wins; an unknown error surfaces its detail; a detail-less error yields the localized default (never `'Error'`); and messages follow the active locale; run `npx vitest run src/__tests__/errorPresenter.test.ts` (red). Skills: `tdd`. *(depends on: none)*
- [x] 1.2 Implement `frontend/src/services/errorPresenter.ts` (`presentError`, `errorCode`, `errorDetail`); add `detail` to `RepositoryError` and drop the `'Error'` default and the exported raw extractors / `toDisplayMessage` in `frontend/src/data/TaskRepository.ts`; add `error.*` keys to `frontend/src/i18n/es.ts` and `en.ts`; move the `toDisplayMessage` assertions in `frontend/src/__tests__/TaskRepository.test.ts` to the presenter test; verify 1.1 passes (green). Skills: `frontend-design`. *(depends on: 1.1)*

## 2. Migrate the call sites (frontend)

- [x] 2.1 (red) Update the call-site tests to the new contract: RegisterPage keeps the conflict wording via an override and the generic fallback on other errors; ResetPasswordPage maps the expired detail; ManageProjectsModal and useTaskForm show localized messages; the Board still surfaces a move failure detail under a localized prefix; run `npx vitest run src/__tests__/RegisterPage.test.tsx src/__tests__/ResetPasswordPage.test.tsx src/__tests__/ManageProjectsModal.test.tsx src/__tests__/useTaskForm.test.ts src/__tests__/TodoListPage.test.tsx` (red). Skills: `tdd`. *(depends on: 1.2)*
- [x] 2.2 Migrate `pages/RegisterPage.tsx`, `pages/ResetPasswordPage.tsx`, `components/ManageProjectsModal.tsx`, `services/errorMessages.ts` / `components/useTaskForm.ts` and `pages/useBoard.ts` to `presentError` (Board uses `useT` and `board.error.*` keys); verify 2.1 passes (green) and no `'Error'` sentinel remains (`rg "'Error'"`). Skills: `frontend-design`. *(depends on: 2.1)*

## 3. Integration verification

- [x] 3.1 Run `npm run build` and `npx vitest run` (green), then `npx playwright test e2e` with the stack up (green; the toast baseline is unchanged); run `openspec validate unify-frontend-error-contract --strict`. Skills: `code-review`. *(depends on: 2.2)*
