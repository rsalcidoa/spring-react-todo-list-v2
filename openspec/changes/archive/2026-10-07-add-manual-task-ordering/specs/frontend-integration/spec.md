# Spec Delta

## ADDED Requirements

### Requirement: Manual Ordering
The board SHALL order each status column by task `position` ascending, breaking ties by `createdAt`, and SHALL let the user reorder tasks by dragging a card to a new position within or across columns. On drop, the page SHALL compute the target position as the midpoint between the new neighbors and call the reorder endpoint optimistically, rolling back and surfacing the error banner on failure.

**ID**: REQ-FE-023
**Affected files**:
- `frontend/src/pages/TodoListPage.tsx` — drag within a column, midpoint computation, optimistic update + rollback
- `frontend/src/components/KanbanColumn.tsx` / `KanbanCard.tsx` — drop targets and index computation
- `frontend/src/data/TaskRepository.ts` — `reorder(id, status, position)`

#### Scenario: Order a column by position
- **WHEN** the board renders a column with tasks at positions 0, 1, 2
- **THEN** the cards appear in that order

#### Scenario: Drag within a column
- **WHEN** the user drags a card between two others in the same column
- **THEN** the card lands between them and its new position is the midpoint of the neighbors

#### Scenario: Reorder failure rolls back
- **WHEN** the reorder request fails
- **THEN** the card returns to its previous position and the error banner names the failure
