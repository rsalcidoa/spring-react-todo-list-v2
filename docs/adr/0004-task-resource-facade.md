# The /v1/tasks resource is served through one TaskModule facade

`TaskModule` composes `TaskService` (listing and CRUD), `TaskOrderingService`
(manual ordering) and `ReminderService` behind one value-oriented interface, and
`TaskController` depends only on it. Considered options: folding the three
services into one — rejected because it relocates code without shrinking the
resource's interface. Consequence: understanding an endpoint no longer requires
knowing which of three beans owns it.
