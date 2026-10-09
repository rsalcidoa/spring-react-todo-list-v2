# Design

## Context

See `proposal.md` — Why. `pages/useBoard.ts` owns the board's read state and the
optimistic mutation policy (ADR-0001). Today each action re-implements the
task-list update and, for `move`/`reorder`, the apply/await/rollback sequence;
error text now comes from `presentError` (#1) and filters from `boardQuery` (#2).

## Goals / Non-Goals

**Goals:**
- One place for the task-list updates the controller applies.
- One place for the optimistic apply/await/rollback policy.
- Keep `useBoard` as the board controller.

**Non-Goals:**
- A store, reducer library, or splitting `useBoard` into several hooks.
- Changing any action's observable result.

## Decisions

1. **Pure list operations `patchTask`/`replaceTask`/`removeTask`/`addTask** over
   `Task[]`.
   - Rationale: the `map`/`filter`/spread shapes repeat across ~6 actions; a pure
     function is trivially testable and keeps identity semantics in one place.
   - Alternative: leave inline — rejected: the shapes drift and are only testable
     through the hook.
2. **`runOptimistic(update)` with an options object** (`before`, `apply`,
   `action`, `rollback`, `onError`).
   - Rationale: two actions share the policy; an options object keeps the call
     site readable (no five positional parameters).
   - Alternative: a positional helper — rejected: unreadable at the call site.
   - Note: `apply`/`rollback` receive the `before` snapshot so the caller decides
     what to restore (a status for `move`, the whole task for `reorder`).
3. **`useBoard` keeps the semantics**: it still calls the repository, chooses the
   snapshot, and composes the localized error (`presentError`). Only the mechanics
   move.
4. **Pessimistic actions (`save`, `delete`, `undo`, `quickAdd`, `removeTag`)
   reuse the list ops** but not `runOptimistic` — they update after the await.

## Risks / Trade-offs

- [Over-abstraction for two optimistic sites] → mitigated by also owning the list
  math (6 sites) and keeping the interface tiny.
- [Behavior drift in the refactor] → `useBoard.test.ts` and `TodoListPage.test.tsx`
  assert the optimistic result, rollback and undo; they must stay green.

## Migration Plan

Frontend-only. Build with `npm run build`. Rollback inlines the mechanics.

## Test Strategy

- **Unit (Vitest):** `boardMutations.test.ts` for the four list ops and
  `runOptimistic` (applies, awaits, rolls back on rejection, calls `onError`, and
  does not roll back on success).
- **Component (Vitest):** `useBoard.test.ts` / `TodoListPage.test.tsx` stay green.
- **E2E (Playwright):** unchanged behavior; run the suite.
- **Backend:** none.
