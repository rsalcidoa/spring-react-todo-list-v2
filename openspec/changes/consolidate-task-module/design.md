# Design

## Context

See `proposal.md` — Why. Ownership lookup is copy-pasted in five services; status parsing in three places; the controller validates query bounds. The resource's interface is scattered across beans.

## Goals / Non-Goals

**Goals:**
- One interface for the task resource; ownership + status parsing decided once.
- Delete dead public surface.

**Non-Goals:**
- Rewriting the service logic; merging tag/project; changing persistence.

## Decisions

1. **A `TaskModule` facade** (chosen) composing the existing services behind one interface; the controller depends only on it.
   - Alternative: fold `TaskOrderingService`/`ReminderService` bodies into `TaskService` — rejected: relocates code without shrinking the resource interface.
2. **A `TaskAccess` module** (chosen): `owned(id)`, `ownedIncludingDeleted(id)`, `softDelete`, `restore`. Alternative: keep duplicated `findOwnedTask` — rejected: five copies drift.
3. **`TaskStatus.parse(String)`** value operation (chosen), used by both status and query paths. Alternative: leave duplicates — rejected.
4. **Delete `getAllTasks()` / `getAllTasksByStatus(...)`** (chosen): no controller calls them.
5. **Move `page`/`size` bounds into `TaskQuery`** (chosen).

## Seam and interface

```
TaskModule: list(query, pageable?) · get(id) · create(req) · update(id, req) ·
            changeStatus(id, status) · reorder(id, status, position) ·
            delete(id) · restore(id) · subtasks(id)
TaskAccess:  owned(id) · ownedIncludingDeleted(id) · softDelete(task) · restore(task)
```

## Risks / Trade-offs

- [Facade becomes a pass-through] -> it earns depth by owning ownership + status + DTO mapping decisions, not just forwarding.
- [Constructor churn in tests] -> update `TaskServiceTest` wiring once.

## Test Strategy

- Unit: `TaskAccessTest` (404/403/soft-delete) and `TaskModuleTest` (use-case wiring) through the interface.
- Regression: existing integration tests (`TaskCrudIntegrationTest`, `OwnershipApiIntegrationTest`, `TaskRecoveryIntegrationTest`, `TaskOrderingApiIntegrationTest`, `ReminderApiIntegrationTest`) stay green.
