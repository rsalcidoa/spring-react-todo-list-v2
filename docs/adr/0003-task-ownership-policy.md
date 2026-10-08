# TaskAccess owns the task ownership and soft-delete policy

`TaskAccess` is the single owner of the task ownership policy: lookup
(`findById` → 404), the forbidden decision (`requireOwned` → 403) and the
soft-delete/restore cascade to Subtasks. `TaskService`, `TaskOrderingService`
and `ReminderService` all cross it instead of each re-implementing the lookup.

Considered options: leaving the duplicated `findOwnedTask` copies. Consequence:
routing ordering and reminders through `TaskAccess` also makes a soft-deleted
Task 404 on those paths, which they previously did not check — this is the
intended, uniform meaning of "owned and live".
