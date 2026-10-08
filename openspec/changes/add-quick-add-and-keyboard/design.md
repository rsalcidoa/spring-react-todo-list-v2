# Design

## Context

See `proposal.md` — Why. `KanbanCard` is a `<div draggable>` with no `tabIndex`; status changes only via `onDrop` -> `handleStatusChange` (optimistic + rollback). `AddTaskModal` is `role="dialog"` with no keyboard close. `repository.create`/`move` already exist.

## Goals / Non-Goals

**Goals:**
- Create a task with a single focusable input, no modal round-trip.
- Move a task without a pointer, reusing the existing move + rollback path.
- Make the modal dismissible and immediately usable from the keyboard.

**Non-Goals:**
- Global shortcuts, customizable keys, keyboard reordering within a column, keyboard delete.

## Decisions

1. **Per-column quick-add input** (chosen) rather than one header field.
   - Rationale: the column already encodes the desired status, so no extra choice.
   - Alternative: a single header quick-add defaulting to PENDING — rejected: forces an extra move for most captures.
2. **`Alt+ArrowLeft/Right` for column moves** (chosen).
   - Rationale: avoids conflict with horizontal scrolling/focus traversal; discoverable and reversible.
   - Alternative: plain arrows — rejected: conflict with scroll/focus. Alternative: a command palette — rejected as a larger separate feature.
3. **Pure `nextStatus(current, direction)` seam** (chosen) so boundaries (`PENDING` left, `COMPLETED` right) are unit-tested without the DOM.
   - Alternative: inline switch in the page — rejected: untestable in isolation.
4. **`Esc` closes + autofocus title** in the modal (chosen), reusing the existing `onClose`.
   - Alternative: a full focus trap — deferred; `Esc` + initial focus is the high-value slice, note it as a follow-up.

## Risks / Trade-offs

- [Focus is lost when the card moves to another column] -> after a keyboard move, keep the moved task id and re-focus its card once it re-renders; cover with a component test.
- [Optimistic move failure leaves focus stranded] -> rollback re-renders the card in its original column; re-focus by id.
- [`Alt+Arrow` may be intercepted by some OS/browser combos] -> document it in the shortcut help and keep `Enter`/`Esc` as the primary keys.

## Migration Plan

Frontend-only; no API or data change. Rollback removes the inputs and handlers.

## Test Strategy

- **Unit (frontend):** `boardKeyboard.test.ts` for `nextStatus` (forward, backward, both ends).
- **Component (frontend):** quick-add creates with the right status and blocks empty; `Alt+Arrow` moves and rolls back on failure; `Enter` opens the modal; `Esc` closes; title autofocus.
- **E2E (Playwright):** quick-add a task, focus it, move it forward with the keyboard, assert the column.

## Non-Goal: quick-add on an empty board

The board renders the empty state (with the create CTA) instead of columns when there are no tasks, so the per-column quick-add is only available once the first task exists. Creating the first task goes through the modal (empty-state CTA); quick-add covers subsequent captures. Making quick-add available on an empty board would require rendering empty columns alongside the empty state and is intentionally out of scope.
