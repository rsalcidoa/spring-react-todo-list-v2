# Spec Delta

## ADDED Requirements

### Requirement: Board Sort Control
The board header SHALL offer a sort control with `Manual` (default), `Recientes`
(`createdAt` desc), `Vence pronto` (`dueDate` asc, dateless last), `Prioridad`
(`priority` desc) and `Título` (`title` asc). When a field sort is selected,
each status column SHALL be ordered by that field. While a field sort is active,
card drag-and-drop SHALL be disabled and the board SHALL indicate that `Manual`
must be selected to reorder.

**ID**: REQ-FE-030
**Affected files**:
- `frontend/src/pages/useBoard.ts` — pass `sort`/`dir` into the per-column ordering
- `frontend/src/services/boardQuery.ts` — apply the sort within a column
- `frontend/src/pages/TodoListPage.tsx` — sort options and default `Manual`
- `frontend/src/components/KanbanColumn.tsx` / `KanbanCard.tsx` — disable drag when sorted

#### Scenario: Field sort orders each column
- **WHEN** the user selects `Vence pronto`
- **THEN** every column shows its tasks ordered by `dueDate` ascending with dateless tasks last

#### Scenario: Manual keeps position ordering
- **WHEN** the sort is `Manual`
- **THEN** each column is ordered by `position` ascending, tie-break `createdAt`

#### Scenario: Drag disabled while sorted
- **WHEN** a field sort is active
- **THEN** cards are not draggable and the board tells the user to choose `Manual` to reorder

## MODIFIED Requirements

### Requirement: Manual Ordering
The board SHALL order each status column by task `position` ascending, breaking ties by `createdAt`, whenever no field sort is active (see "Board Sort Control"), and SHALL let the user reorder tasks by dragging a card to a new position within or across columns. On drop, the page SHALL compute the target position as the midpoint between the new neighbors and call the reorder endpoint optimistically, rolling back and surfacing the error banner on failure.

**ID**: REQ-FE-023
**Affected files**:
- `frontend/src/pages/TodoListPage.tsx` — drag within a column, midpoint computation, optimistic update + rollback
- `frontend/src/components/KanbanColumn.tsx` / `KanbanCard.tsx` — drop targets and index computation
- `frontend/src/data/TaskRepository.ts` — `reorder(id, status, position)`

#### Scenario: Order a column by position
- **WHEN** the board renders a column with tasks at positions 0, 1, 2 and no field sort is active
- **THEN** the cards appear in that order

#### Scenario: Drag within a column
- **WHEN** the user drags a card between two others in the same column
- **THEN** the card lands between them and its new position is the midpoint of the neighbors

#### Scenario: Reorder failure rolls back
- **WHEN** the reorder request fails
- **THEN** the card returns to its previous position and the error banner names the failure
