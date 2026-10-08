# Proposal

## Why

`frontend/src/components/AddTaskModal.tsx` (286 lines) performs tag create/delete, subtask create/delete/toggle, its own validation and error mapping, then notifies the page through callbacks that mutate *page* state; the page also owns tag/task state and computes tag usage for the modal. Form parsing (recurrence `'NONE'`, `reminderAt.slice(0,16)`, `projectId` string↔number) is hand-rolled and mirrored by `fromWire` in the repository.

## What Changes

- Add a `useTaskForm(editingTask, repository)` deep module owning fields, parsing, validation and the tag/subtask sub-resources, exposing `{ values, errors, save, addSubtask, toggleSubtask, addTag, removeTag }`.
- `AddTaskModal` becomes presentation; the page stops proxying tag/subtask state.

**Non-goals:** changing the form's fields or validation rules; new capabilities.

**Rollback plan:** revert to the inline handlers; behavior identical.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. Behavior-preserving refactor; `skip_specs: true`.

## Impact

- **Frontend (TS):** new `frontend/src/components/useTaskForm.ts`; `frontend/src/components/AddTaskModal.tsx`; `frontend/src/pages/TodoListPage.tsx` callbacks.
