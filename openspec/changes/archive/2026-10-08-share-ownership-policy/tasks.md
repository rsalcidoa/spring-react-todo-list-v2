# Tasks

Backend refactor; no behavior change (`skip_specs`). Each task ends with a
verification command. Run backend commands from `backend/` (PostgreSQL up:
`docker compose up -d postgres`).

## 1. The Ownership module (backend)

- [x] 1.1 (red) Add `backend/src/test/java/com/example/todo/service/OwnershipTest.java` asserting `lookup` throws `ResourceNotFoundException` when absent, `requireOwned` throws `OwnershipDeniedException` for a foreign owner, and the composed method returns the entity when owned; run `mvn test -Dtest=OwnershipTest` (red). Skills: `tdd`. *(depends on: none)*
- [x] 1.2 Implement `backend/src/main/java/com/example/todo/service/Ownership.java` and route `TaskAccess`, `ProjectService` and `TagService` through it (preserving the `TaskAccess` soft-deleted ordering); update the constructors in `TaskAccessTest`, `ReminderServiceTest`, `TaskServiceTest`, `TagServiceTest`; verify `mvn test -Dtest=OwnershipTest` passes (green). Skills: `codebase-design`. *(depends on: 1.1)*

## 2. Integration verification

- [x] 2.1 Run `mvn test` (green; the error contract is byte-identical for 400/403/404) and `openspec validate share-ownership-policy --strict`. Skills: `code-review`. *(depends on: 1.2)*
