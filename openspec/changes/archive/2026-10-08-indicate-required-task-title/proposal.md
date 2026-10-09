# Proposal

## Why

Three paths offer no feedback when the input is empty:

- The task dialog's **Save** button looks enabled with a blank title (the inline
  error only appears after clicking, and with the dialog now scrollable that message
  is easily missed).
- **Adding a blank Subtask** silently does nothing (`useTaskForm.addSubtask` returns
  on a blank title).
- **Creating/renaming a project** with a blank name silently does nothing
  (`ManageProjectsModal.submit` returns early).

## What Changes

- **Disable the task dialog's Save** while the required title is blank (visually
  disabled), keeping the inline title message as a fallback.
- **Warn on a blank Subtask**: the task dialog shows an inline message instead of
  silently ignoring it.
- **Warn on a blank project name**: the project dialog shows an inline message
  instead of silently ignoring it.

**Non-goals**:
- Changing the validation rules (the backend stays the source of truth).
- A validation summary or a new form library.

**Scope**: `frontend/src`.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `frontend-integration`: a new requirement "Required Field Indication" (REQ-FE-044)
  pins the disabled Save and the inline messages for blank Subtask/project names.

## Impact

Affected files:
- `frontend/src/components/AddTaskModal.tsx` / `.module.css` — disabled Save and the
  Subtask message.
- `frontend/src/components/useTaskForm.ts` — a `subtaskError` for a blank Subtask.
- `frontend/src/components/ManageProjectsModal.tsx` / `.module.css` — a name message.
- `frontend/src/i18n/es.ts`, `en.ts` — `task.subtaskRequired`, `project.nameRequired`.
- Tests: `AddTaskModal.test.tsx`, `ManageProjectsModal.test.tsx`.

No API or data change.

**Rollback plan**: remove the `disabled` binding and the two inline messages.

> Fourth of the current batch; a focused UX fix.
