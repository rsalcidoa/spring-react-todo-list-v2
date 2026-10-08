# Proposal

## Why

Capturing a task requires opening the modal with the mouse, and moving a task between columns is drag-only. There is no keyboard path to create or move a task, which is both slow for keyboard users and an accessibility gap (drag-and-drop is unreachable without a pointer). This is block D of the roadmap (velocidad + a11y).

## What Changes

- **Quick add:** a compact input at the top of each column body that creates a task from just a title (Enter or a small button), using that column's status, `priority=LOW` and no tags. Empty/whitespace titles are blocked inline; errors surface through the existing ErrorBanner.
- **Keyboard board navigation:** task cards become focusable; with `Alt+ArrowLeft` / `Alt+ArrowRight` the focused task moves to the previous/next status column (reusing the same move operation and rollback as drag), announced via the existing transient error banner on failure. `Enter` opens the edit modal.
- **Dialog a11y:** the task modal closes on `Esc` and focuses the title field on open.

**Non-goals:**
- A global command palette, customizable keybindings, or keyboard delete.
- Server changes; all operations reuse existing endpoints (`create`, PATCH status).

**Rollback plan:** remove the quick-add inputs and the keyboard handlers; drag-and-drop and the modal stay as today. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds "Quick Add Task", "Keyboard Board Navigation" and "Dialog Keyboard Accessibility" requirements.

## Impact

- **Frontend (TS):** `frontend/src/pages/TodoListPage.tsx`, `frontend/src/components/KanbanColumn.tsx`, `frontend/src/components/KanbanCard.tsx`, `frontend/src/components/AddTaskModal.tsx`, a new quick-add input, a pure `boardKeyboard.ts` helper, and tests.
- **API/Backend:** none.
