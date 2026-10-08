# Proposal — Tag picker as a dropdown in the task modal

## Why

In the task modal the tag control renders an inline bounded list, while the
board uses a collapsed dropdown. They should behave the same.

## What Changes

- Use the `TagSelect` component in `collapsible` mode in the task modal: a
  "Tags (n)" button that opens the search input + bounded list + per-tag delete.
- Show the selected tags as chips so the selection is visible while collapsed.

**Non-goals:** changing tag creation/deletion rules; the board control.

**Rollback plan:** drop `collapsible`/`showChips` from the modal usage and
restore the previous assertions. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: `Tag Filter and Picker` — the modal uses the same
  collapsible dropdown (with selected chips).

## Impact

- **Frontend (TS):** `frontend/src/components/AddTaskModal.tsx`,
  `frontend/src/__tests__/AddTaskModal.test.tsx`, visual baselines.
