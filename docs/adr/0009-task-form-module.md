# useTaskForm owns the form; the board controller persists the task

`useTaskForm` owns the task form — field values, parsing
(recurrence/reminder/project), title validation and the tag/subtask
sub-resources through the repository — while `AddTaskModal` is presentation
over its interface. Considered options: a plain `TaskForm` class (it needs a
React binding anyway) and leaving the handlers in the modal (removing them just
moves the tag/subtask state the page already proxies).

Deliberate boundary: persisting the task itself stays in the board controller
(`useBoard`), because it must update the board's task list optimistically; the
form only builds and validates the `TaskInput`.
