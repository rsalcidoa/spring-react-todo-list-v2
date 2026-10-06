# Proposal

## Why

The board groups tasks by status only. There is no way to focus on "what is due now": the user must scan every card and read its due chip. This is block A of the roadmap (focalizar) and builds on the tags/due-state already present.

## What Changes

- Add a view selector in the board header: `Todas` (default), `Hoy`, `Vencidas` and `Próximas` (next 7 days).
- Add a pure, testable module `frontend/src/services/boardView.ts` exposing `BoardView` and `filterByView(tasks, view, today)`, reusing the existing `dueState` logic.
- The active view composes with the existing tag filter and priority/search controls; per-column counts and empty states reflect the filtered set.

**Non-goals:**
- No backend or API change; views are computed over the already-loaded tasks.
- Custom date ranges, a calendar view, or saved views.

**Rollback plan:** remove the selector and `boardView.ts`; the board returns to the status-only grouping. Frontend-only, no data migration.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds a "Board Smart Views" requirement (view selector + filtering semantics).

## Impact

- **Frontend (TS):** `frontend/src/pages/TodoListPage.tsx` (selector + compose with filters), new `frontend/src/services/boardView.ts`, tests in `frontend/src/__tests__/`.
- **API/Backend:** none.
