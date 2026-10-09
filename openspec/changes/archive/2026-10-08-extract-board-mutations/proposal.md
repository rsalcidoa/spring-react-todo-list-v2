# Proposal

## Why

The board controller (`useBoard`) spends its mutation actions re-writing the same
two patterns by hand: the task-list math (`prev.map(t => t.id === id ? … : t)`,
`prev.filter(...)`, `[...prev, task]`) and, for `move`/`reorder`, the optimistic
policy (apply, await, roll back on failure). Neither has a home, so the same
shape is spread across the hook and can only be tested through it.

## What Changes

- **New deep module `services/boardMutations.ts`** with a small interface:
  - pure list operations `patchTask`, `replaceTask`, `removeTask`, `addTask`;
  - `runOptimistic({ before, apply, action, rollback, onError })`, which owns the
    optimistic policy.
- **`useBoard` actions stop hand-writing list math** and the rollback policy; they
  cross the module instead. Behavior is unchanged.
- **Honest scoping note**: the review said the optimistic pattern repeats per
  action; in fact exactly `move` and `reorder` are optimistic. The list math
  repeats in ~6 actions (`move`, `reorder`, `save`, `delete`, `undo`, `quickAdd`,
  `removeTag`). The module covers both, placed at the seam the hook already has.

**Non-goals**:
- No behavior change; no new store or state library; `useBoard` stays the single
  board controller (ADR-0001).
- No change to the repository port or the error contract (it delegates the message
  to `presentError`).

**Scope**: `frontend/src`. Pure refactor (`skip_specs`).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
<!-- none: pure refactor, skip_specs -->

## Impact

Affected files:
- `frontend/src/services/boardMutations.ts` (new) — list ops + optimistic runner.
- `frontend/src/pages/useBoard.ts` — actions use the module; keeps the hooks and
  the repository calls.
- `frontend/src/__tests__/boardMutations.test.ts` (new) — pure unit coverage.

No API, dependency, or behavior impact. Depends on the error module (#1) for the
`onError` text and on the consolidated `useBoard` (#2).

**Rollback plan**: inline the list math and the two rollback blocks again.

> Third of five architectural deepenings; the Board controller keeps its
> responsibility (ADR-0001) but delegates the mechanics.
