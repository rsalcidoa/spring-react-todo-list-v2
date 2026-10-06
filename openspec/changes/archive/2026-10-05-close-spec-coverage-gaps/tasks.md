# Tasks

## 1. Backend task/status coverage

- [x] 1.1 Add a test asserting creation without `status` returns `PENDING` and creation with `"status":"ACTIVE"` echoes it; verify `mvn -Dtest=TaskCrudIntegrationTest test`.
- [x] 1.2 Add a test asserting `GET /v1/tasks/{id}` returns `status` and a `tags` array with multiple `{id,name}` entries; verify `mvn -Dtest=TagResolutionIntegrationTest test`.
- [x] 1.3 Add tests for `GET /v1/tasks?status=ACTIVE` and `?status=COMPLETED`; verify `mvn -Dtest=TaskCrudIntegrationTest test`.
- [x] 1.4 Add tests for PUT status change (PENDING→ACTIVE, ACTIVE→COMPLETED) asserting the response, and PUT without `status` leaving it unchanged; verify `mvn -Dtest=TaskCrudIntegrationTest test`.
- [x] 1.5 Add tests for `priority: HIGH` created and returned; verify `mvn -Dtest=TaskCrudIntegrationTest test`.

## 2. Backend validation/auth coverage

- [x] 2.1 Add tests for blank/null `title` on POST and PUT `/v1/tasks` returning 400 with a `title` field error (and no task created/updated); verify `mvn -Dtest=ErrorContractIntegrationTest test`.
- [x] 2.2 Add a test for registering with an empty email returning 400 with an `email` field error; verify `mvn -Dtest=ErrorContractIntegrationTest test`.
- [x] 2.3 Add a test that login with a short non-blank password passes validation and returns 401 on wrong credentials (no `@Size` rule on login); verify `mvn -Dtest=AuthControllerTest test`.

## 3. Backend tag coverage

- [x] 3.1 Add a test for `POST /v1/tags` with a name longer than 50 chars returning 400 with a `name` field error; verify `mvn -Dtest=TagApiIntegrationTest test`.
- [x] 3.2 Add an integration test for successful `DELETE /v1/tags/{id}` (204) that verifies the tag is unassigned from a task that carried it while the task remains; verify `mvn -Dtest=TagApiIntegrationTest test`.
- [x] 3.3 Add a test that `GET /v1/tags` for user B never returns user A's tags; verify `mvn -Dtest=TagApiIntegrationTest test`.
- [x] 3.4 Add a service test that a task-save failure after tag resolution commits no tag rows (rollback); verify `mvn -Dtest=TaskServiceTest test`.

## 4. Frontend coverage

- [x] 4.1 Add a test asserting the Axios request interceptor attaches `Authorization: Bearer <token>` when a token is stored; verify `npm test -- --run -- session ApiService`.
- [x] 4.2 Add a test asserting an empty Kanban column renders the plain "Sin tareas" text; verify `npm test -- --run -- TodoListPage`.
- [x] 4.3 Add page-level tests that an invalid email blocks submit and shows the "Formato de email inválido" banner in Login and Register; verify `npm test -- --run -- LoginPage RegisterPage`.
- [x] 4.4 Add tests asserting the HTML5 `required` attribute on the email inputs; verify `npm test -- --run -- LoginPage RegisterPage`.
- [x] 4.5 Add tests for the "Inicia sesión" link on Register and the "¿Olvidaste tu contraseña?" link on Login pointing to the right routes; verify `npm test -- --run -- LoginPage RegisterPage`.
- [x] 4.6 Add a Register test asserting the success path calls register then login then navigates to `/tasks`; verify `npm test -- --run -- RegisterPage`.
- [x] 4.7 Add a Reset test asserting navigation to `/login` on success using the existing `navigateMock`, and assert the reset/forgot links' `href`; verify `npm test -- --run -- ResetPasswordPage ForgotPasswordPage`.
- [x] 4.8 Add a page-level test that two errors within 5s leave a single banner (newest replaces previous); verify `npm test -- --run -- TodoListPage`.

## 5. E2E fix and verify

- [x] 5.1 Fix `full-flow.spec.ts` to use the Spanish locator `getByPlaceholder(/Nueva etiqueta/)` plus the `/Crear/` button, and assert the created tag appears on the card before deletion; verify with the stack up: `npx playwright test e2e/full-flow.spec.ts`.
- [x] 5.2 Run the full suites with Postgres up: `mvn test`, `npm test -- --run`, `npm run build`; confirm all green (depends on groups 1–4).
