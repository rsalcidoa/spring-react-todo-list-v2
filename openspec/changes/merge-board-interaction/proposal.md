# Proposal

## Why

The pure micro-modules `boardKeyboard.ts` (14 lines), `taskOrdering.ts` (10), `boardView.ts` (33), `dueState.ts` (16) and `format.ts` (19) are shallow: their interfaces are nearly as complex as their implementations, and their dedicated tests test what the compiler would catch. The behaviour that actually breaks — drop-index from `clientY` (`KanbanColumn`), keyboard move plus focus restoration, due-state presentation (`KanbanCard`) — lives at the call sites and is only covered by heavy DOM tests.

## What Changes

- Merge the interaction helpers into one `BoardInteraction` module owning drag-to-index, keyboard-to-status-and-refocus, and due-state-to-presentation as cohesive operations.
- Keep the trivial math private; the seam is the interaction, not the arithmetic.

**Non-goals:** changing interactions or visuals; new gestures.

**Rollback plan:** revert to the standalone helpers; behavior identical.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. Behavior-preserving refactor; `skip_specs: true`.

## Impact

- **Frontend (TS):** new `frontend/src/services/boardInteraction.ts`; `components/{KanbanColumn,KanbanCard}.tsx`; absorb `services/{boardKeyboard,taskOrdering,boardView,dueState}.ts`.
