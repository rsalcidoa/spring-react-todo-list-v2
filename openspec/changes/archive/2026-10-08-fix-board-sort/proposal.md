# Proposal — Fix the board sort control

## Why

The board header's sort control is inert. `useBoard` groups tasks by status and
always sorts each column by `position` then `createdAt` (`groupByStatus`), and
`applyFilters` never passes `sort`/`dir` to `BoardQuery`. So choosing a sort
changes neither the column order nor the visible order. Two specs also conflict:
"Task List View" says sorting orders tasks *within each column*, while
"Manual Ordering" (REQ-FE-023) says columns order by `position`.

## What Changes

- The sort control offers **Manual** (default) plus **Recientes**
  (`createdAt desc`), **Vence pronto** (`dueDate asc`), **Prioridad**
  (`priority desc`) and **Título** (`title asc`).
- **Manual** → each column orders by `position` ascending, tie-break `createdAt`
  (current REQ-FE-023).
- Any other option → each column orders by that field (dateless tasks last for
  `dueDate`).
- While a field sort is active, card **drag-and-drop is disabled** (with a hint
  to pick Manual to reorder), so dragging never appears broken.

**Non-goals:** changing the server query API or adding sort fields; removing
Manual ordering; changing pagination.

**Rollback plan:** revert the changed frontend files; the sort control returns
to its current inert state. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds "Board Sort Control" and refines "Manual
  Ordering" (position ordering applies when no field sort is active).

## Impact

- **Frontend (TS):** `frontend/src/pages/useBoard.ts`,
  `frontend/src/services/boardQuery.ts`, `frontend/src/pages/TodoListPage.tsx`,
  `frontend/src/components/KanbanColumn.tsx`, `frontend/src/components/KanbanCard.tsx`,
  tests under `frontend/src/__tests__/`.
