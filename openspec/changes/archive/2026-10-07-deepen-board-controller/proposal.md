# Proposal

## Why

`frontend/src/pages/TodoListPage.tsx` (450 lines) is a god module: ~20 state cells, 6 effects, and six optimistic mutation flows that each re-implement "snapshot → optimistic patch → await repository → rollback on error → localized error". The pure helpers it leans on (`boardView`, `taskOrdering`, `boardKeyboard`) are shallow and don't own the failures; the defect surface is the call sequencing.

## What Changes

- Add a `useBoard(repository)` deep module with a narrow interface: `{ tasks, tags, projects, filters, error, loading, actions }`.
- Move optimistic application, rollback snapshots, the undo lifecycle, query debounce, pagination state and error translation into it.
- `TodoListPage` becomes a view over that interface; the pure helpers become private implementation.

**Non-goals:** no behavior or UI change; no new features; not touching the transport (`ApiService`).

**Rollback plan:** revert the new module and rewire the page back; behavior is identical throughout.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. Behavior-preserving refactor; `skip_specs: true`.

## Impact

- **Frontend (TS):** `frontend/src/pages/TodoListPage.tsx`, new `frontend/src/pages/useBoard.ts`, `frontend/src/services/{boardView,taskOrdering,boardKeyboard}.ts` (folded in).
