# Spec Delta

## ADDED Requirements

### Requirement: Required Field Indication
The task dialog SHALL keep its Save action disabled while the required title is
blank, so an empty title cannot be submitted. Attempting to add a Subtask with a
blank title SHALL show an inline message and create nothing. Attempting to
create or rename a project with a blank name SHALL show an inline message and
submit nothing. Inline messages SHALL follow the active locale.

**ID**: REQ-FE-044
**Affected files**:
- `frontend/src/components/AddTaskModal.tsx` / `AddTaskModal.module.css` — disabled Save and the blank-Subtask message
- `frontend/src/components/useTaskForm.ts` — `subtaskError`
- `frontend/src/components/ManageProjectsModal.tsx` / `.module.css` — blank-name message
- `frontend/src/i18n/es.ts`, `frontend/src/i18n/en.ts` — messages

#### Scenario: Save is disabled until the title is present
- **WHEN** the task dialog renders with a blank title
- **THEN** its Save action is disabled
- **AND** it becomes enabled once the title is non-blank

#### Scenario: A blank Subtask is flagged
- **WHEN** the user activates Add with a blank Subtask title
- **THEN** an inline message is shown and no Subtask is created

#### Scenario: A blank project name is flagged
- **WHEN** the user submits the project dialog with a blank name
- **THEN** an inline message is shown and nothing is created or renamed
