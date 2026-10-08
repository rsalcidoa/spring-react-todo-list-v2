# Tasks

## 1. Tooling

- [x] 1.1 Set `build` to `tsc --noEmit && vite build` in `frontend/package.json` and verify `npm run build` passes (and fails on a deliberately missing i18n key).

## 2. Backend scenario tests

- [x] 2.1 `ProjectApiIntegrationTest`: rename/delete of another user's project returns 403; verify `mvn -Dtest=ProjectApiIntegrationTest test`.
- [x] 2.2 `SubtaskApiIntegrationTest`: a `parentId` owned by another user returns 400 `errors.parentId`; verify `mvn -Dtest=SubtaskApiIntegrationTest test`.
- [x] 2.3 `TaskRecoveryIntegrationTest`: restoring another user's task returns 403; verify `mvn -Dtest=TaskRecoveryIntegrationTest test`.
- [x] 2.4 `RecurringApiIntegrationTest`: a recurring task with `reminderAt` produces a child whose reminder is shifted by the same delta; verify `mvn -Dtest=RecurringApiIntegrationTest test`.

## 3. Ordering test

- [x] 3.1 Add a drag-within-column test (component or e2e) asserting `repository.reorder` receives a midpoint between neighbors; verify `npm test -- --run` / `npx playwright test`.

## 4. Cleanup and docs

- [x] 4.1 Remove unused `dto/LoginResponse.java` and its import; verify `mvn -q -DskipTests package`.
- [x] 4.2 Remove the dead `handleDrop` in `TodoListPage.tsx`; verify `npm run build`.
- [x] 4.3 Align `openspec/changes/add-responsive-layout` spec/design (breakpoints come from tokens; `@media` literals must match).
- [x] 4.4 Record quick-add-on-empty-board as a non-goal in `add-quick-add-and-keyboard/design.md`.

## 5. Verify

- [x] 5.1 `mvn test`, `npm run build`, `npm test -- --run`, `npx playwright test` with Postgres up; confirm green.
