# Spec Delta

## MODIFIED Requirements

### Requirement: Header Project Action and Drag Feedback
The board header actions SHALL include a "New project" button **before** the "New task" button, with the user avatar after them, opening the Manage projects dialog. The two action buttons SHALL share the same box model (padding, font size, line height, border width and border radius) so they render at the same size. "New task" SHALL be the primary action (filled with the accent color) and "New project" SHALL be a secondary action (muted outline), without shortening its label. A board column SHALL show its drag-over highlight only while a card is dragged over it, and the highlight SHALL remain stable while the dragged card moves across the column's own children (cards, quick-add control), clearing only when the card leaves the column or is dropped (no flicker and no stale highlight after a drop or when the board content changes).

**ID**: REQ-FE-039
**Affected files**:
- `frontend/src/pages/TodoListPage.tsx` — header action order and "New project" button
- `frontend/src/pages/TodoListPage.module.css` — shared action button box model and primary/secondary emphasis
- `frontend/src/components/KanbanColumn.tsx` — depth-tracked drag-over highlight

#### Scenario: New project from the header
- **WHEN** the user activates "New project" in the header
- **THEN** the Manage projects dialog opens

#### Scenario: Project action precedes the task action
- **WHEN** the board header renders
- **THEN** the "New project" button appears before the "New task" button

#### Scenario: Header actions render at the same size
- **WHEN** the board header renders both action buttons
- **THEN** "Nuevo proyecto" and "+ Tarea" have the same height and box model

#### Scenario: The task action is the primary emphasis
- **WHEN** the board header renders both action buttons
- **THEN** "New task" is filled with the accent color and "New project" is a muted outline

#### Scenario: The highlight is stable while dragging within a column
- **WHEN** a card is dragged over a column and the pointer moves across the column's own children (a card or the quick-add control)
- **THEN** the column keeps its drag-over highlight without flicker

#### Scenario: Highlight clears after a drop
- **WHEN** a card is dropped on a column
- **THEN** the column's highlight is removed immediately

#### Scenario: Highlight clears when the card leaves the column
- **WHEN** a dragged card leaves the column for good
- **THEN** the column's highlight is removed

#### Scenario: No stale highlight when the scope changes
- **WHEN** the user reorders a task and then changes the project scope
- **THEN** no column remains highlighted
