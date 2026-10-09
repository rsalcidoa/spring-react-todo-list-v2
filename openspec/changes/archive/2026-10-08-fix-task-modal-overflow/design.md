# Design

## Context

See `proposal.md` — Why. `AddTaskModal` renders the header, then every field, then
the actions, as direct children of `.modal`, which has no height cap. The overlay
centers it. `ManageProjectsModal` already caps itself (`max-height: 90vh;
overflow-y: auto`).

## Goals / Non-Goals

**Goals:**
- The dialog never exceeds the viewport.
- Save/Cancel stay visible regardless of content height.

**Non-Goals:**
- Sticky positioning tricks.
- Changing the field markup beyond wrapping it.

## Decisions

1. **Flex-column dialog with a scrollable body and pinned actions.**
   `.modal { display: flex; flex-direction: column; max-height: 90vh; }`,
   `.modalBody { overflow-y: auto; min-height: 0; }`, `.actions { flex: none; }`.
   - Rationale: the header and actions stay fixed while only the fields scroll —
     robust and predictable, no `position: sticky` quirks with the modal padding.
   - Alternative: `position: sticky` on `.actions` — rejected: needs negative
     margins/background hacks to sit flush.
2. **Wrap the fields in a `.modalBody` div** in `AddTaskModal.tsx`; the header and
   actions stay outside it.
3. **Mobile** keeps `height: 100vh`; the flex column plus the scrollable body make
   it scroll correctly (previously the content just overflowed).

## Risks / Trade-offs

- [The actions row gains a top separation when scrolled] → give it a top border and
  surface background so the boundary reads clearly.
- [Existing visual baselines] → with the resting content shorter than 90vh, the
  dialog looks the same; refresh only if a diff appears.

## Migration Plan

Frontend-only. Build with `npm run build`. Rollback removes the wrapper and rules.

## Test Strategy

- **E2E (Playwright):** new `modal-overflow.spec.ts` creates many Subtasks (through
  the API for stability), opens the edit dialog and asserts the Save button is
  within the viewport.
- **Component (Vitest):** existing `AddTaskModal.test.tsx` stays green (the wrapper
  is inert in happy-dom).
