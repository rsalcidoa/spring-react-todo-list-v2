# Spec Delta

## ADDED Requirements

### Requirement: Quick Add Task
Each board column SHALL provide a compact quick-add input that creates a task from a title alone. Submitting SHALL create the task through the repository with the column's status, `priority=LOW` and no tags, and the task SHALL appear in that column without opening the modal. An empty or whitespace-only title SHALL be blocked inline without a request; a backend rejection SHALL surface through the ErrorBanner.

**ID**: REQ-FE-020
**Affected files**:
- `frontend/src/components/QuickAddTask.tsx` — new input + submit handling
- `frontend/src/components/KanbanColumn.tsx` — renders the quick-add with the column status
- `frontend/src/pages/TodoListPage.tsx` — wires quick-add to `repository.create`

#### Scenario: Quick-add creates a task in the column
- **WHEN** the user types a title in a column's quick-add input and presses Enter
- **THEN** a task is created with that column's status, `priority=LOW` and no tags, and appears in the column

#### Scenario: Empty quick-add is blocked inline
- **WHEN** the user submits an empty or whitespace-only title
- **THEN** no request is sent and an inline message is shown

#### Scenario: Quick-add failure is surfaced
- **WHEN** the create request fails
- **THEN** the ErrorBanner shows the contract message and no phantom task is added

### Requirement: Keyboard Board Navigation
Task cards SHALL be keyboard-focusable. When a card has focus, `Alt+ArrowLeft` and `Alt+ArrowRight` SHALL move the task to the previous / next status column (order `PENDING -> ACTIVE -> COMPLETED`), reusing the same move operation and optimistic rollback as drag-and-drop; at the ends of the order the key SHALL be a no-op. `Enter` on a focused card SHALL open the edit modal. The move target logic SHALL live in one pure module so it is unit-testable.

**ID**: REQ-FE-021
**Affected files**:
- `frontend/src/services/boardKeyboard.ts` — `nextStatus(current, direction)` pure
- `frontend/src/components/KanbanCard.tsx` — `tabIndex`, `onKeyDown`, `aria-label`
- `frontend/src/pages/TodoListPage.tsx` — handles the move via the existing status handler

#### Scenario: Move a task forward with the keyboard
- **WHEN** a focused PENDING task receives `Alt+ArrowRight`
- **THEN** its status becomes ACTIVE and the card renders in the ACTIVE column

#### Scenario: Move a task backward with the keyboard
- **WHEN** a focused COMPLETED task receives `Alt+ArrowLeft`
- **THEN** its status becomes ACTIVE

#### Scenario: No-op at the ends of the order
- **WHEN** a focused PENDING task receives `Alt+ArrowLeft`, or a COMPLETED task receives `Alt+ArrowRight`
- **THEN** the status is unchanged and no request is sent

#### Scenario: Keyboard move failure rolls back
- **WHEN** the move request fails
- **THEN** the task returns to its previous column and the transient error banner names the failure

#### Scenario: Enter opens the edit modal
- **WHEN** a focused card receives Enter
- **THEN** the edit modal opens for that task

### Requirement: Dialog Keyboard Accessibility
The task modal SHALL close on `Esc` and SHALL move focus to the title field when it opens, so it is operable without a pointer.

**ID**: REQ-FE-022
**Affected files**:
- `frontend/src/components/AddTaskModal.tsx` — `Esc` handling and initial focus, trailing the existing `role="dialog"`

#### Scenario: Escape closes the modal
- **WHEN** the modal is open and the user presses `Esc`
- **THEN** the modal closes (same as the Cancel/close action)

#### Scenario: Focus starts on the title
- **WHEN** the modal opens
- **THEN** the title input receives focus
