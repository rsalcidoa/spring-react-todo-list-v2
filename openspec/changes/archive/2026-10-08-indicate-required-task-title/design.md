# Design

## Context

See `proposal.md` — Why. `AddTaskModal` renders Save/Cancel; `useTaskForm.buildInput`
already validates the title and sets `titleError`, but the button is not disabled.
`useTaskForm.addSubtask` and `ManageProjectsModal.submit` return early on blank
input with no message.

## Goals / Non-Goals

**Goals:**
- No silent no-ops for blank required input.
- The task's Save is obviously unavailable until the title is present.

**Non-Goals:**
- Moving validation into a shared library.
- Disabling the project button (an inline message is enough there).

## Decisions

1. **Disable `Save` when `form.values.title.trim()` is empty**, with a disabled
   style; keep `buildInput`'s `titleError` as a fallback for programmatic submits.
   - Rationale: a disabled action is a clear, immediate indicator; the title input
     already shows a `*`.
   - Alternative: keep the button enabled and rely on the inline error — rejected:
     easy to miss in a tall dialog.
2. **`useTaskForm` gains `subtaskError`**, set by `addSubtask` on a blank title and
   cleared by `setNewSubtask`; the modal renders it under the Subtask input.
   - Rationale: the form owns the Subtask sub-resource (ADR-0009); the error belongs
     with it.
3. **`ManageProjectsModal` gains a `nameError`**, set on submit with a blank name and
   cleared on change; rendered under the name input.
   - Rationale: minimal, mirrors the task title handling without disabling.

## Risks / Trade-offs

- [A disabled Save removes the click-to-see-error path] → intended; the `*` and the
  disabled state communicate it, and `titleError` remains as a fallback.
- [Test churn] → update the empty-title test to assert the disabled state, and add
  cases for the Subtask and project messages.

## Migration Plan

Frontend-only. Build with `npm run build`. Rollback removes the bindings/messages.

## Test Strategy

- **Component (Vitest):** `AddTaskModal.test.tsx` (Save disabled/enabled; blank
  Subtask message), `ManageProjectsModal.test.tsx` (blank-name message).
- **E2E (Playwright):** the dialog keeps the same resting layout; no baseline change.
