# Tasks

Backend behavior change. Each task ends with a verification command. Run backend
commands from `backend/` (PostgreSQL up: `docker compose up -d postgres`).

## 1. Inherit the Project and forbid Subtask recurrence (backend)

- [x] 1.1 (red) Extend `backend/src/test/java/com/example/todo/RecurringApiIntegrationTest.java`: a recurring Task in a Project produces a next occurrence with the same `projectId`; a create with `parentId` + `recurrence` returns 400 `errors.recurrence`; run `mvn test -Dtest=RecurringApiIntegrationTest` (red). Skills: `tdd`. *(depends on: none)*
- [x] 1.2 In `backend/src/main/java/com/example/todo/service/TaskService.java`, copy the project in `generateNextOccurrence` and reject a non-`NONE` recurrence on a task that has a parent in `validateRecurrence`; verify 1.1 passes (green). Skills: `codebase-design`. *(depends on: 1.1)*

## 2. Integration verification

- [x] 2.1 Run `mvn test` (green) and `openspec validate recurring-occurrence-inherits-project --strict`. Skills: `code-review`. *(depends on: 1.2)*
