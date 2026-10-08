# Spec Delta

## MODIFIED Requirements

### Requirement: Header Project Action and Drag Feedback
The board header actions SHALL include a styled secondary "New project" button **before** the "New task" button, with the user avatar after them, opening the Manage projects dialog. A board column SHALL show its drag-over highlight only while a card is dragged over it, and the highlight SHALL clear when the card leaves or is dropped (no stale highlight after a drop or when the board content changes).

**ID**: REQ-FE-039
**Affected files**:
- `frontend/src/pages/TodoListPage.tsx` — header action order and "New project" button
- `frontend/src/pages/TodoListPage.module.css` — secondary button style
- `frontend/src/components/KanbanColumn.tsx` — state-driven drag-over highlight

#### Scenario: New project from the header
- **WHEN** the user activates "New project" in the header
- **THEN** the Manage projects dialog opens

#### Scenario: Project action precedes the task action
- **WHEN** the board header renders
- **THEN** the "New project" button appears before the "New task" button, styled as a visible secondary button

#### Scenario: Highlight clears after a drop
- **WHEN** a card is dropped on a column
- **THEN** the column's highlight is removed immediately

#### Scenario: No stale highlight when the scope changes
- **WHEN** the user reorders a task and then changes the project scope
- **THEN** no column remains highlighted
