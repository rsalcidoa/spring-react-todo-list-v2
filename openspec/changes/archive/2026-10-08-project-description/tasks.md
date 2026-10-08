# Tasks

> Skills: `tdd`.

## 1. Description end to end (backend)

- [x] 1.1 Add Flyway `V12__add_project_description.sql` and the `description` field to `Project`.
- [x] 1.2 (red) Backend tests: create/list/rename carry the optional `description`; description >500 rejected. Verify red.
- [x] 1.3 Update `ProjectRequest`, `ProjectResponse` and `ProjectService`; verify `mvn -Dtest=ProjectApiIntegrationTest,ProjectServiceTest test` (or the existing project tests) green.
- [x] 1.4 `mvn test`; confirm 0 failures.
