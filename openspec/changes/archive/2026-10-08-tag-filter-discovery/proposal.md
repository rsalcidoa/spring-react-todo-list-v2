# Proposal — Searchable tag filter and picker

## Why

Every tag is rendered at once: the board's filter row lists all tags as pills
and the task modal lists all tags as pills. With hundreds or thousands of tags
both become unusable.

## What Changes

- Add a shared `TagSelect` control with a search box: a bounded, filtered list
  of matching tags, chips for the selected ones, and a clear action.
- The board replaces the tag pill row with a "Filter by tag" control that opens
  the searchable `TagSelect` (selection still composes with OR).
- The task modal replaces its tag pills with the same `TagSelect`; creating and
  deleting a tag stays available.
- Neither surface renders the full tag list at once.

**Non-goals:** server-side tag search/pagination; changing the OR semantics or
the tag rules.

**Rollback plan:** revert the components and call sites; the previous pill
rendering returns. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds "Tag Filter and Picker".

## Impact

- **Frontend (TS):** new `frontend/src/components/TagSelect.tsx` (+ css),
  `pages/TodoListPage.tsx`, `components/AddTaskModal.tsx` /
  `components/useTaskForm.ts`, tests, visual baselines.
