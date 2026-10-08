# Tasks

> Skills: `tdd`; `codebase-design`.

## 1. Ownership + status

- [ ] 1.1 (red) `TaskAccessTest`: `owned` throws 404 then 403 for foreign owner; `softDelete` cascades to children; verify red.
- [ ] 1.2 Implement `TaskAccess` and `TaskStatus.parse`; route `TaskService`/`TaskOrderingService`/`ReminderService` through `TaskAccess`; verify `mvn -Dtest=TaskAccessTest test` green. Skills: `tdd`.
- [ ] 1.3 Delete `getAllTasks()`/`getAllTasksByStatus(...)`; move page/size bounds into `TaskQuery`; verify `mvn -Dtest=TaskQueryIntegrationTest,TaskPaginationIntegrationTest test`.

## 2. Facade

- [ ] 2.1 Introduce `TaskModule` and make `TaskController` depend only on it; verify `mvn test`.
- [ ] 2.2 `mvn test` full; confirm 0 failures.
