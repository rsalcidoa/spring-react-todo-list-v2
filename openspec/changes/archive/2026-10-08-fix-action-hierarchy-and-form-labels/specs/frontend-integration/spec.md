# Spec Delta

## MODIFIED Requirements

### Requirement: Header Project Action and Drag Feedback
The board header actions SHALL include a "New project" button **before** the "New task" button, with the user avatar after them, opening the Manage projects dialog. The two action buttons SHALL share the same box model (padding, font size, line height, border width and border radius) so they render at the same size. "New task" SHALL be the primary action (filled with the accent color) and "New project" SHALL be a secondary action (muted outline), without shortening its label. A board column SHALL show its drag-over highlight only while a card is dragged over it, and the highlight SHALL clear when the card leaves or is dropped (no stale highlight after a drop or when the board content changes).

**ID**: REQ-FE-039
**Affected files**:
- `frontend/src/pages/TodoListPage.tsx` — header action order and "New project" button
- `frontend/src/pages/TodoListPage.module.css` — shared action button box model and primary/secondary emphasis
- `frontend/src/components/KanbanColumn.tsx` — state-driven drag-over highlight

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

#### Scenario: Highlight clears after a drop
- **WHEN** a card is dropped on a column
- **THEN** the column's highlight is removed immediately

#### Scenario: No stale highlight when the scope changes
- **WHEN** the user reorders a task and then changes the project scope
- **THEN** no column remains highlighted

### Requirement: Tag Filter and Picker
Tag selection SHALL use a searchable, collapsible dropdown that never renders the full tag list at once. It SHALL show a toggle, a text input that filters tags by name (case-insensitive), a bounded list of matching tags, and a chip per selected tag with a way to clear the selection. The board header SHALL expose it as a "Filter by tag" control whose selection narrows the visible tasks (a task matches when it carries any selected tag). The task modal SHALL use the same collapsible dropdown for a task's tags, showing the selected tags as chips, keeping the ability to create and delete tags. In the task modal, the dropdown toggle SHALL be the single visible label for the control (its `aria-label` stays "Etiquetas"); the modal SHALL NOT render a separate heading that repeats that label. The dropdown SHALL present its toggle, search input, option list and selected chips with consistent vertical spacing in both the board filter and the task modal, and the control SHALL span the width of its row.

**ID**: REQ-FE-038
**Affected files**:
- `frontend/src/components/TagSelect.tsx` — searchable, collapsible tag control
- `frontend/src/pages/TodoListPage.tsx` — board "Filter by tag"
- `frontend/src/components/AddTaskModal.tsx` / `useTaskForm.ts` — task tag dropdown and its single visible label

#### Scenario: Filter tags by name
- **WHEN** the user types part of a tag name in the control
- **THEN** only matching tags are listed (bounded), regardless of how many tags exist

#### Scenario: Select tags on the board
- **WHEN** the user selects one or more tags and closes the control
- **THEN** the selected tags show as chips and only tasks carrying any selected tag remain visible

#### Scenario: Clear the board tag filter
- **WHEN** the user clears the selection
- **THEN** every task is shown again

#### Scenario: Pick tags in the task modal
- **WHEN** the user opens the tag dropdown, searches and selects tags
- **THEN** the selected tags show as chips and are applied to the saved task, and the full tag list is never rendered at once

#### Scenario: The task modal shows one tag label
- **WHEN** the task modal renders the tags control
- **THEN** the "Etiquetas" label appears exactly once, on the dropdown toggle

#### Scenario: Consistent dropdown spacing
- **WHEN** the tag dropdown is used on the board or in the task modal
- **THEN** its toggle, search input, option list and selected chips are separated by the same spacing

#### Scenario: The tag control spans its row
- **WHEN** the tag dropdown renders on the board or in the task modal
- **THEN** the control spans the full width of its row

## ADDED Requirements

### Requirement: Modal Form Layout
In the task and project dialogs, each field label SHALL render above its control with a consistent vertical gap, so labels never sit flush against or overlap their inputs, selects or textareas. Fields laid out side by side SHALL stack their label over their control within their own column rather than flowing inline. Inline validation messages SHALL render below their field without overlapping it. The tags block SHALL stack the tag dropdown (dropdown toggle, search input and option list) above the create-new-tag row with a visible vertical gap, so the search input, the option pills and the create input never pile up.

**ID**: REQ-FE-041
**Affected files**:
- `frontend/src/components/AddTaskModal.module.css` — stacked label layout, tag block spacing and validation spacing
- `frontend/src/components/AddTaskModal.tsx` — removes the duplicated tags heading

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
