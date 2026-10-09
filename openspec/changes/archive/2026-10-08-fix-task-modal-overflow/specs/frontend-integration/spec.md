# Spec Delta

## MODIFIED Requirements

### Requirement: Modal Form Layout
In the task and project dialogs, each field label SHALL render above its control with a consistent vertical gap, so labels never sit flush against or overlap their inputs, selects or textareas. Fields laid out side by side SHALL stack their label over their control within their own column rather than flowing inline. Inline validation messages SHALL render below their field without overlapping it. The tags block SHALL stack the tag dropdown (dropdown toggle, search input and option list) above the create-new-tag row with a visible vertical gap, so the search input, the option pills and the create input never pile up. The task dialog SHALL stay within the viewport, scrolling its fields when its content is taller, while its Save and Cancel actions remain visible and reachable.

**ID**: REQ-FE-041
**Affected files**:
- `frontend/src/components/AddTaskModal.module.css` — stacked label layout, tag block spacing, validation spacing and the bounded, scrollable dialog
- `frontend/src/components/AddTaskModal.tsx` — removes the duplicated tags heading; wraps the scrollable body

#### Scenario: Priority and status stack their labels
- **WHEN** the task dialog renders the priority and status fields
- **THEN** each label appears above its own select with a visible gap

#### Scenario: Inline validation does not overlap
- **WHEN** the title is required and the validation message appears
- **THEN** the message renders below the title input without covering it

#### Scenario: Labels are spaced consistently
- **WHEN** two dialogs render their fields
- **THEN** each label and its control are separated by the same vertical gap

#### Scenario: The tags block is not piled up
- **WHEN** the task dialog renders the tags block with the dropdown open
- **THEN** the dropdown toggle, search input and option list are separated from the create-new-tag row by a visible gap, and none of them overlap the create input

#### Scenario: The dialog stays within the viewport
- **WHEN** the task dialog has more content than fits the viewport (for example many Subtasks)
- **THEN** the dialog does not exceed the viewport height, its fields scroll, and the Save and Cancel actions remain visible
