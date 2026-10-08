# Design

## Context

See `proposal.md` — Why. The page owns mutation policy inline (`handleStatusChange`, `handleSave`, `handleReorder`, `handleDelete`/`handleUndo`, `handleQuickAdd`, `loadMore`) and the undo/error lifecycles. The extracted helpers are correct but trivial (deletion test: removing them moves 1–5 lines into a caller).

## Goals / Non-Goals

**Goals:**
- One interface a caller (and a test) crosses for the whole board: read state + `actions`.
- Rollback and undo policy in one module (locality).

**Non-Goals:**
- New behavior; changes to the repository port or transport; a global store.

## Decisions

1. **A `useBoard` hook** (chosen) over a class/context. Rationale: React-idiomatic, fits the page; context/global store is unnecessary for one board.
   - Alternative: a `BoardController` class — rejected: needs React binding anyway.
2. **Rollback via a pre-mutation snapshot of `tasks`** (chosen) — the current pattern, now centralized. Alternative: per-action inverse ops — rejected: more code, more drift.
3. **One internal `applyOptimistic(patch, request)`** used by every mutation (chosen): mutate state, await repository, rollback+translate on failure. Ensures every mutation behaves the same.
4. **Fold `boardView`/`taskOrdering`/`boardKeyboard` in as private implementation** (chosen): they are shallow; their tests move to `useBoard.test`.

## Seam and interface

```
useBoard(repository): {
  tasks, tags, projects, filters, error, loading,
  actions: { move, reorder, save, delete, undo, quickAdd, loadMore, setQuery, setView, setTagFilter, setProjectFilter }
}
```

## Risks / Trade-offs

- [Large first move] -> keep the page's public behavior identical; characterization tests must stay green before/after.
- [Hook hiding too much] -> the interface stays value-oriented (state + named actions), not a store handle.

## Test Strategy

- Unit: `useBoard.test.ts` drives optimistic move + rollback, undo lifecycle, pagination reset — through the hook interface only.
- Regression: existing `TodoListPage.test.tsx` stays green unchanged (behavior preserved).
