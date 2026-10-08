# Design

## Context

See `proposal.md` — Why. Deletion test: removing the modal's tag/subtask handlers moves them into the page, which already proxies that state — complexity is relocated, so the split has no locality.

## Goals / Non-Goals

**Goals:**
- One module owns the task form: values, parsing, validation, sub-resources.
- The page stops proxying tag/subtask state.

**Non-Goals:**
- Changing validation rules or fields; i18n changes.

## Decisions

1. **A `useTaskForm` hook** (chosen): fits the React component; owns parsing/validation and calls the repository for tag/subtask sub-resources.
   - Alternative: a plain `TaskForm` class — rejected: needs a React binding anyway.
2. **Parsing (recurrence/reminder/project) lives beside the form** (chosen), not duplicated with `fromWire`.
3. **The page keeps only the board's task list** (chosen); tag/subtask refresh flows through the form/repository.

## Seam and interface

```
useTaskForm(editingTask, repository): {
  values: TaskInput, errors, saving,
  save(): Promise<Task>,
  addSubtask(title), toggleSubtask(id), removeSubtask(id),
  addTag(name), removeTag(id)
}
```

## Risks / Trade-offs

- [Hook owns too much] -> the interface is value-oriented actions; the modal passes `values`/`errors` down to inputs.
- [Existing modal tests query DOM] -> keep the markup; tests keep passing; add focused `useTaskForm.test`.

## Test Strategy

- Unit: `useTaskForm.test.ts` (parsing, validation, sub-resource ops) through the hook interface with `InMemoryTaskRepository`.
- Regression: `AddTaskModal.test.tsx`, `TodoListPage.test.tsx` stay green.
