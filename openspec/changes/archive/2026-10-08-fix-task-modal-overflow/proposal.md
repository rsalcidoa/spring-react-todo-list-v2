# Proposal

## Why

The task dialog has no height bound: `.modal` sets only `width`/`max-width`, so
with many Subtasks it grows past the viewport. The dialog is centered by the
overlay, so its top and bottom are clipped, and the Save/Cancel row at the bottom
scrolls out of reach — you cannot save or cancel the task you just edited.

## What Changes

- **Bound the dialog and keep the actions reachable**: the task dialog becomes a
  flex column with a capped height (90vh on desktop, full viewport on mobile), a
  scrollable body for the fields/Subtask list, and a pinned actions row that stays
  visible.
- **No change** to the fields, the Subtask list behavior or the Save/Cancel actions.

**Non-goals**:
- A sticky header or a redesigned dialog shell.
- Changing the tag/Subtask controls.

**Scope**: `frontend/src`.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `frontend-integration`: REQ-FE-041 (Modal Form Layout) is extended with a
  scenario pinning that the dialog scrolls while its actions remain reachable.

## Impact

Affected files:
- `frontend/src/components/AddTaskModal.tsx` — wrap the scrollable body; keep the
  header and actions outside it.
- `frontend/src/components/AddTaskModal.module.css` — flex-column dialog, capped
  height, scrollable body, pinned actions.
- `frontend/e2e/modal-overflow.spec.ts` (new) — regression test with many Subtasks.

No API or data change. If the resting dialog height is unchanged, the visual
baselines stay.

**Rollback plan**: remove the wrapper and the height/overflow rules.

> Third of the current batch; a focused UI fix.
