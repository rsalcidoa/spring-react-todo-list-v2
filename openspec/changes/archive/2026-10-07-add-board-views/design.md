# Design

## Context

See `proposal.md` — Why. `TodoListPage` already composes a tag filter over the loaded tasks and `frontend/src/services/dueState.ts` defines `overdue|today|future|none` from a task's `dueDate` against the local date. Smart views should reuse that notion instead of re-deriving dates.

## Goals / Non-Goals

**Goals:**
- One pure, unit-testable place that decides what each view shows.
- Compose cleanly with the existing tag/search/priority filters.

**Non-Goals:**
- Backend filtering, custom ranges, saved views, calendar.

## Decisions

1. **Pure module `boardView.ts` with `filterByView(tasks, view, today)`** (chosen).
   - Rationale: no rendering needed to test boundaries; single source of view semantics.
   - Alternative: inline predicate in the page — rejected: untestable in isolation and duplicates date math.
   - Alternative: a backend `due` query param — rejected: adds a request and API surface for data already loaded at personal scale.
2. **Time-based views exclude COMPLETED** (chosen). `Todas` does not.
   - Rationale: "what do I do now" should not surface finished work.
   - Alternative: include completed — rejected as noise.
3. **`today` is injected** into `filterByView` (chosen) so tests are deterministic; the page passes the current date.
4. **`Próximas` window is `(today, today+7]`** (chosen), matching a week-ahead horizon.

## Risks / Trade-offs

- [A second date path alongside `dueState`] -> `boardView` builds on `getDueState` for `Hoy`/`Vencidas` and only adds the 7-day window, keeping one definition of "overdue/today".
- [Locale/timezone drift] -> compare on local date components, exactly as `dueState` does.

## Migration Plan

Frontend-only; no data or API change. Rollback removes the selector and the module.

## Test Strategy

- **Unit (frontend):** `boardView.test.ts` — each view at its boundaries (today, yesterday, +7, +8), completed exclusion, null due date.
- **Component (frontend):** `TodoListPage.test.tsx` — selecting a view narrows the visible tasks and composes with the tag filter.
- **E2E (optional):** selector present and toggles the visible set.
