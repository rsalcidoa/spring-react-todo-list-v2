# recurrence Specification

## Purpose
Computes and materializes the next occurrence of a recurring task so a repeated chore does not have to be recreated by hand.

## Requirements

### Requirement: Next Occurrence Computation
The system SHALL compute the next occurrence's due date from the current due date and the rule, in one pure function: `DAILY` = +1 day, `WEEKLY` = +7 days, `MONTHLY` = +1 month clamped to the last valid day of the target month. A `DAILY`/`WEEKLY`/`MONTHLY` rule SHALL require a non-null `dueDate`.

**ID**: REQ-REC-001
**Affected files**:
- `com.example.todo.service.RecurrenceRule` — pure `nextDueDate(LocalDate current, Recurrence rule)`
- `com.example.todo.model.Task` — `recurrence` enum field

#### Scenario: Daily advances one day
- **WHEN** the next occurrence of a `DAILY` task with due date `2026-01-31` is computed
- **THEN** the next due date is `2026-02-01`

#### Scenario: Weekly advances seven days
- **WHEN** the next occurrence of a `WEEKLY` task with due date `2026-01-01` is computed
- **THEN** the next due date is `2026-01-08`

#### Scenario: Monthly clamps to month end
- **WHEN** the next occurrence of a `MONTHLY` task with due date `2026-01-31` is computed
- **THEN** the next due date is `2026-02-28`
