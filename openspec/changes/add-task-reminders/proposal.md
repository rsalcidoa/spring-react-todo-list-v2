# Proposal

## Why

`dueDate` is passive: the board shows a due chip but never alerts the user. Block B (tiempo) makes the app proactive. Since no email service is available, delivery is in-app plus browser notifications.

## What Changes

- Add an optional `reminderAt` (timestamp) to a task, with migration `V5__add_task_reminders.sql` adding `reminder_at` and `reminder_notified_at`.
- New capability `reminders`: `GET /v1/tasks/reminders` returns the user's reminders that are due and not yet notified; `POST /v1/tasks/{id}/reminder-ack` marks one as delivered (idempotent).
- Frontend: a `reminderAt` field in the task modal and a poller that requests notification permission and raises a browser `Notification` per due reminder, plus an in-app indicator.

**Non-goals:**
- Email or push (no email/notification service), recurring reminders, snooze.
- A backend scheduler: due-ness is computed on read.

**Rollback plan:** remove the poller and field, and drop the two columns (migration down). No data loss beyond reminders.

## Capabilities

### New Capabilities

- `reminders`: compute and deliver due task reminders in-app.

### Modified Capabilities

- `task-management`: adds a "Task Reminder Field" requirement (optional `reminderAt` on create/update/response).

## Impact

- **Backend (Java):** `com.example.todo.model.Task`, `dto/TaskRequest`/`TaskResponse`, `repository/TaskRepository`, new `service/ReminderService`, `controller/TaskController`, migration `V5__add_task_reminders.sql`.
- **Frontend (TS):** `frontend/src/components/AddTaskModal.tsx`, new `frontend/src/services/reminders.ts` (poller + Notification), `frontend/src/pages/TodoListPage.tsx`.
- **API:** additive; tasks without `reminderAt` behave exactly as today.
