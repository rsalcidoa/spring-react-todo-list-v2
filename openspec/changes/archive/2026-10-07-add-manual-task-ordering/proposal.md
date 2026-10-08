# Proposal

## Why

Within a column, tasks are ordered by creation time; users cannot put the most important card on top. Block C (estructura): let people arrange a column by hand, the way a physical board works.

## What Changes

- Add a `position` (double) to a task, representing its order within its status column.
- New endpoint `PATCH /v1/tasks/{id}/position` accepting `{status, position}` to move a task within or across columns; the frontend computes the target position as the midpoint between its new neighbors.
- The board orders each column by `position` ascending (then `createdAt`), and drag-and-drop reorders within a column as well as across columns.

**Non-goals:**
- Real-time multi-device conflict resolution, custom sort per column, a rebalance UI.

**Rollback plan:** remove the ordering UI and the position endpoint, and drop `tasks.position` (migration down). The board falls back to creation order.

## Capabilities

### New Capabilities

- `task-ordering`: persist and update a task's manual order within its status column.

### Modified Capabilities

- `frontend-integration`: adds a "Manual Ordering" requirement (drag within a column, order by position).

## Impact

- **Backend (Java):** `model/Task` (+`position`), `dto/TaskResponse` (+`position`), new `dto/PositionUpdateRequest`, `service/TaskOrderingService`, `controller/TaskController`, `repository/TaskRepository`, migration `V9__add_task_position.sql`.
- **Frontend (TS):** `frontend/src/pages/TodoListPage.tsx`, `frontend/src/components/KanbanColumn.tsx`/`KanbanCard.tsx`, `frontend/src/data/TaskRepository.ts`.
- **API:** additive; existing tasks get `position = 0` and keep their current relative order.
