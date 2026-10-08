# Spec Delta

## ADDED Requirements

### Requirement: Completed Task Treatment
A task whose Status is Completed SHALL be visually distinct from non-completed
tasks: its title SHALL be struck through and the card muted, using theme tokens
(not literal colors).

**ID**: REQ-FE-032
**Affected files**:
- `frontend/src/components/KanbanCard.tsx` — apply the completed class
- `frontend/src/components/KanbanCard.module.css` — struck-through + muted treatment

#### Scenario: Completed card is struck through and muted
- **WHEN** a task in the Completed column renders
- **THEN** its title is struck through and the card is muted, distinct from pending/active cards

### Requirement: Inline Validation Clears on Edit
An inline validation message offered by a form SHALL clear as soon as the user
edits the offending field, rather than persisting until the next submit.

**ID**: REQ-FE-033
**Affected files**:
- `frontend/src/components/QuickAddTask.tsx` — clear the inline error on input change
- `frontend/src/components/useTaskForm.ts` — clear the title error on title change

#### Scenario: Quick-add error clears when typing
- **WHEN** an empty quick-add was rejected and the user types a title
- **THEN** the inline error disappears

#### Scenario: Modal title error clears when typing
- **WHEN** saving with a blank title shows the inline error and the user types
- **THEN** the inline error disappears
