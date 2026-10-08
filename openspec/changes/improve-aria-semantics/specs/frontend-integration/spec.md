# Spec Delta

## ADDED Requirements

### Requirement: Accessible Status Announcements
The board SHALL announce transient status through a non-interactive polite live region (`role="status"` / `aria-live="polite"`). Any interactive control offered alongside a status message (the "Deshacer" action) SHALL live outside the live region, SHALL receive focus when it appears, and SHALL NOT be removed by the auto-dismiss timer while it retains focus. The board region SHALL expose `aria-busy="true"` while tasks are loading.

**ID**: REQ-FE-029
**Affected files**:
- `frontend/src/pages/TodoListPage.tsx` — separate live announcement, focusable undo button, focus-aware dismiss, `aria-busy`
- `frontend/src/pages/TodoListPage.module.css` — `.srOnly` visually-hidden helper

#### Scenario: Deletion is announced without embedding a control
- **WHEN** the user deletes a task
- **THEN** a polite live region announces the deletion and contains no interactive elements

#### Scenario: Undo button receives focus
- **WHEN** the undo affordance appears after a deletion
- **THEN** focus moves to the "Deshacer" button so it is operable from the keyboard

#### Scenario: Auto-dismiss pauses while focused
- **WHEN** the undo button has focus
- **THEN** the transient affordance is not removed by the timer until focus leaves

#### Scenario: Board reports busy while loading
- **WHEN** the board is loading tasks
- **THEN** the board region exposes `aria-busy="true"`
