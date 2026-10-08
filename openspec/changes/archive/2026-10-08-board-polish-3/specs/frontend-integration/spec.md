# Spec Delta

## ADDED Requirements

### Requirement: Header Project Action and Drag Feedback
The board header actions SHALL include a "New project" action alongside the
"New task" button and the user avatar, opening the Manage projects dialog. A
board column SHALL show its drag-over highlight only while a card is dragged
over it, and the highlight SHALL clear when the card leaves or is dropped (no
stale highlight after a drop or when the board content changes).

**ID**: REQ-FE-039
**Affected files**:
- `frontend/src/pages/TodoListPage.tsx` — the header "New project" action
- `frontend/src/components/KanbanColumn.tsx` — state-driven drag-over highlight

#### Scenario: New project from the header
- **WHEN** the user activates "New project" in the header
- **THEN** the Manage projects dialog opens

#### Scenario: Highlight clears after a drop
- **WHEN** a card is dropped on a column
- **THEN** the column's highlight is removed immediately

#### Scenario: No stale highlight when the scope changes
- **WHEN** the user reorders a task and then changes the project scope
- **THEN** no column remains highlighted
