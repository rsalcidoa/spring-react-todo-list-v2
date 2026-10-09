# Spec Delta

## MODIFIED Requirements

### Requirement: Completed Task Treatment
A task whose Status is Completed SHALL be visually distinct from non-completed
tasks: its title SHALL be struck through and the card muted, using theme tokens
(not literal colors). When the task carries a `completedAt` timestamp, the card
SHALL also show the completion date (date only, per the active locale) alongside
its Due-state chip, so a completed overdue task shows both "Vencida" and its
completion date.

**ID**: REQ-FE-032
**Affected files**:
- `frontend/src/components/KanbanCard.tsx` — apply the completed class and render the completion date
- `frontend/src/components/KanbanCard.module.css` — struck-through + muted treatment and the completion-date chip
- `frontend/src/services/taskPresentation.ts` — the localized `completedLabel`

#### Scenario: Completed card is struck through and muted
- **WHEN** a task in the Completed column renders
- **THEN** its title is struck through and the card is muted, distinct from pending/active cards

#### Scenario: Completed card shows the completion date
- **WHEN** a Completed task has a `completedAt` timestamp
- **THEN** the card shows the completion date in the active locale

#### Scenario: A completed overdue task shows both labels
- **WHEN** a Completed task's Due date is in the past
- **THEN** the card shows both the "Vencida" chip and the completion date
