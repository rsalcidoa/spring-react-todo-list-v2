# Proposal

## Why

Two `frontend-integration` requirements drift from the shipped UI. REQ-FE-013 states a blank tag name is rejected by the backend with 400 Bad Request and surfaced through the ErrorBanner, but `AddTaskModal` silently returns and never calls the backend. REQ-FE-014 and its Affected files state the deleted tag is removed from the available list via a `loadTags()` refresh, but the page only mutates local state. Both make the specs unreliable as a regression contract.

## What Changes

- `AddTaskModal.handleCreateTag`: remove the silent early return so a blank/whitespace name is sent, rejected by the backend (400), and shown in the ErrorBanner.
- `TodoListPage.onTagDeleted`: after the optimistic update, call `loadTags()` so the available tags list is re-read from the source of truth (REQ-FE-014).
- Update `AddTaskModal.test.tsx` and `TodoListPage.test.tsx` to assert the aligned behavior.

**Non-goals:**
- No new endpoints or changes to the successful tag create/delete flow.
- No change to task tag assignment semantics.

**Rollback plan:** revert the two component/page changes and their tests; behavior returns to the previous optimistic-only form. No data migration.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. This aligns code to the existing `frontend-integration` REQ-FE-013 / REQ-FE-014 requirements; no spec-level behavior changes, so the change sets `skip_specs: true`.

## Impact

- **Frontend (TS):** `frontend/src/components/AddTaskModal.tsx`, `frontend/src/pages/TodoListPage.tsx`.
- **Tests (TS):** `frontend/src/__tests__/AddTaskModal.test.tsx`, `frontend/src/__tests__/TodoListPage.test.tsx`.
- **API:** an extra `POST /v1/tags` for blank names (rejected) and a `GET /v1/tags` after deletion; no contract change.
