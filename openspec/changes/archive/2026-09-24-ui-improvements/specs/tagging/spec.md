# Spec Delta

## ADDED Requirements

### Requirement: Tag Management from Modal UI
The system SHALL allow authenticated users to create and delete tags directly from the task creation/editing modal interface. Tag creation and deletion SHALL NOT require navigating to a separate management page.

**Affected files**:
- `frontend/src/components/AddTaskModal.tsx` — input for new tag creation, delete button on existing tag pills
- `frontend/src/components/AddTaskModal.module.css` — styles for `.tagInput`, `.tagCreateBtn`, `.tagDeleteBtn`
- `frontend/src/pages/TodoListPage.tsx` — trigger `loadTags()` after tag create/delete operations
- `frontend/src/services/ApiService.ts` — `createTag()` and `deleteTag()` endpoints already exist

#### Scenario: User creates and assigns a new tag to a task
- **WHEN** user types a tag name in the new tag input, clicks "Create", then clicks the new tag pill
- **THEN** the tag is created via `POST /v1/tags` and assigned to the task via the existing tagNames flow
- **AND** the tag appears in the tag pills list after automatic refresh

#### Scenario: User deletes a tag that is not assigned to any task
- **WHEN** user clicks the delete button (×) on a tag pill
- **THEN** the tag is deleted via `DELETE /v1/tags/{id}`
- **AND** the tag is removed from the list and unassigned from all associated tasks

#### Scenario: User deletes a tag that is assigned to a task
- **WHEN** user clicks the delete button (×) on a tag pill that is assigned to existing tasks
- **THEN** the tag is deleted and unassigned from all associated tasks
- **AND** the tasks remain intact without the deleted tag
