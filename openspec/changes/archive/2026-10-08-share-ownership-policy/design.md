# Design

## Context

See `proposal.md` — Why. `TaskAccess` centralizes Task ownership (ADR-0003);
`ProjectService` and `TagService` inline the same `findById -> 404 ->
requireOwned (403)` sequence. `CurrentUserProvider.requireOwned` owns the 403
decision. The specs mandate 400 for a task's unknown/foreign `projectId`/`parentId`.

## Goals / Non-Goals

**Goals:**
- One module owns the resource-ownership policy across Tasks, Tags and Projects.
- Preserve the exact status codes and ordering of checks.

**Non-Goals:**
- Touching the 400 project/parent validation (spec-mandated).
- Changing `TaskAccess`'s soft-delete/restore cascade.

## Decisions

1. **`Ownership` module with `lookup(id, findById)` (404) and
   `requireOwned(entity, ownerId)` (403), plus a composed
   `requireOwned(id, findById, ownerId)`.**
   - Rationale: separates "absent" (404) from "not yours" (403) so callers can
     order them; `TaskAccess` needs the soft-deleted check *between* the two.
   - Alternative: one composed method — rejected: it would force
     `requireOwned` before the soft-deleted check, turning a foreign soft-deleted
     Task from 404 into 403 (a behavior change).
2. **`TaskAccess.owned` uses `lookup` → deleted check → `requireOwned`**;
   `ownedIncludingDeleted` uses the composed method. Same observable behavior as
   today (ADR-0003).
3. **`ProjectService` and `TagService` use the composed method.** Their 404/403
   behavior is unchanged.
4. **Task sub-resource validation stays in `TaskService`** (`applyProject`,
   `applyParent`) with `InvalidQueryValueException` → 400, per the specs.

## Risks / Trade-offs

- [Constructor changes ripple into tests] → mechanical updates in four unit tests;
  the Spring integration tests are unaffected.
- [Ordering of 404 vs 403 for soft-deleted foreign tasks] → preserved by decision 2;
  `TaskAccessTest` guards it.

## Migration Plan

Backend-only refactor; no Flyway migration. Build/test with `mvn test` (PostgreSQL
up). Rollback re-inlines the policy.

## Test Strategy

- **Unit (JUnit + Mockito):** `OwnershipTest` for lookup-404, not-owned-403 and the
  owned happy path.
- **Existing unit tests:** `TaskAccessTest`, `TagServiceTest`, `TaskServiceTest`,
  `ReminderServiceTest` stay green after the constructor updates.
- **Integration (MockMvc + PostgreSQL):** `mvn test` keeps the error contract
  byte-identical (400/403/404 paths).
