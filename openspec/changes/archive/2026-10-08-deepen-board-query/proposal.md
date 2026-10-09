# Proposal

## Why

“Which Tasks the Board shows and in what order” (the Query) is spread across
three parallel shapes — `BoardFilters` (UI strings), `BoardQuery` (domain) and
`TaskQuery` (transport) — and the `BoardFilters → BoardQuery` coercion lives
inline in `useBoard.applyFilters`, untested. The Due-state rules are split
between the interaction module (`getDueState`, `filterByView`) and the query
module (`compareTasks`). Understanding selection means bouncing between
`useBoard`, `boardQuery` and `boardInteraction`.

## What Changes

- **`BoardQuery` becomes the single query module.** It owns the selection +
  ordering rules, the Due-state rules (`getDueState`, `filterByView`, `BoardView`,
  `DueState`, `todayLocal`) and a `boardQueryFrom(filters: BoardFilters)` that owns
  the UI→domain coercion.
- **`boardInteraction` slims to pointer/keyboard interaction** (`MoveDirection`,
  `keyboardTarget`, `positionBetween`, `dropIndex`, `restoreFocus`).
- **`useBoard` stops re-deriving** the query: it calls `boardQueryFrom(filters)`.
- **Correct ADR-0005's wording**: the server mirrors the search/priority/tags and
  ordering fields; Project scope and date Views are computed client-side over the
  loaded Tasks (per REQ-FE-019 / REQ-FE-037), so the server does not mirror them.

**Non-goals**:
- No behavior change: selection, ordering and Due-state results are identical.
- No backend `projectId`/`view` support (intentionally client-only per REQ-FE-019 /
  REQ-FE-037).
- No change to the in-memory adapter's server-supported subset.

**Scope**: `frontend/src` + the ADR wording. Pure refactor; no spec-level behavior
change (this change sets `skip_specs`).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
<!-- none: pure refactor, skip_specs -->

## Impact

Affected files:
- `frontend/src/services/boardQuery.ts` — the deepened module (+`boardQueryFrom`).
- `frontend/src/services/boardInteraction.ts` — interaction only.
- `frontend/src/pages/useBoard.ts` — uses `boardQueryFrom`; `BoardFilters` moves.
- `frontend/src/components/KanbanCard.tsx`, `frontend/src/pages/TodoListPage.tsx`
  — import the moved types/functions from `boardQuery`.
- `frontend/src/__tests__/boardQuery.test.ts`, `boardInteraction.test.ts` — the
  Due-state cases move to the query test; new coercion cases.
- `docs/adr/0005-board-query.md` — wording corrected.

No API, dependency, or behavior impact. ADR-0005 and ADR-0008 name these modules;
this change finishes ADR-0005's consolidation.

**Rollback plan**: revert the file moves; no data or API migration.

> Second of five architectural deepenings. Depends on nothing; unblocks the
> optimistic-update module, which will sit on a stable `useBoard`.
