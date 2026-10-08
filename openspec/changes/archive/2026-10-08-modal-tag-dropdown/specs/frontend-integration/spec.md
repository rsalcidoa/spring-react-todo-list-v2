# Spec Delta

## MODIFIED Requirements

### Requirement: Tag Filter and Picker
Tag selection SHALL use a searchable, collapsible dropdown that never renders the full tag list at once. It SHALL show a toggle, a text input that filters tags by name (case-insensitive), a bounded list of matching tags, and a chip per selected tag with a way to clear the selection. The board header SHALL expose it as a "Filter by tag" control whose selection narrows the visible tasks (a task matches when it carries any selected tag). The task modal SHALL use the same collapsible dropdown for a task's tags, showing the selected tags as chips, keeping the ability to create and delete tags.

**ID**: REQ-FE-038
**Affected files**:
- `frontend/src/components/TagSelect.tsx` — searchable, collapsible tag control
- `frontend/src/pages/TodoListPage.tsx` — board "Filter by tag"
- `frontend/src/components/AddTaskModal.tsx` / `useTaskForm.ts` — task tag dropdown

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
