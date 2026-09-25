# Spec Delta — backend-validation (elementos de tagNames)

## MODIFIED Requirements

### Requirement: Task Input Validation (REQ-BV-003)
The system SHALL validate that task creation and update requests include a non-blank title via `@NotBlank` on TaskRequest DTO. Each element of the optional `tagNames[]` array SHALL itself be validated: non-blank after trimming (`@NotBlank`) and at most 50 characters (`@Size(max=50)`), consistent with the tag name rules (REQ-TAG-005). Element violations SHALL produce a 400 Bad Request with field-level details grouped under the `tagNames` key. The `@Valid` annotation shall be added to the controller method parameter in TaskController for both POST /v1/tasks (create) and PUT /v1/tasks/{id} (update).

**Affected files**:
- `com.example.todo.dto.TaskRequest.java` — add `@NotBlank(message = "Title must not be blank") @Size(max=255, message = "Title must not exceed 255 characters")` to title field; add element constraints `@NotBlank(message = "Tag name must not be blank") @Size(max=50, message = "Tag name must not exceed 50 characters")` on `tagNames`
- `com.example.todo.exception.GlobalExceptionHandler` — collapse element paths (`tagNames[i]`) to the `tagNames` key in the validation 400 body
- `com.example.todo.controller.TaskController.createTask()` and `.updateTask()` — accept request body annotated with `@Valid` (already present)

#### Scenario: Task creation rejects empty title
- **WHEN** authenticated user sends POST /v1/tasks with blank or null title
- **THEN** Bean Validation fails on `@NotBlank` constraint for title
- **AND** system returns 400 Bad Request with error details containing validation message for title field

#### Scenario: Task creation passes validation and creates task
- **WHEN** authenticated user sends POST /v1/tasks with non-blank valid title, optional description, valid priority, and optional due date
- **THEN** Bean Validation passes
- **AND** system returns 201 Created with the created task data including assigned id and user_id

#### Scenario: Task update rejects empty title
- **WHEN** authenticated user sends PUT /v1/tasks/{id} with blank or null title
- **THEN** Bean Validation fails on `@NotBlank` constraint for title
- **AND** system returns 400 Bad Request with error details containing validation message for title field

#### Scenario: Task update passes validation and updates task
- **WHEN** authenticated user sends PUT /v1/tasks/{id} with non-blank valid title, optional description, valid priority, and optional due date
- **THEN** Bean Validation passes
- **AND** system returns 200 OK with the updated task data

#### Scenario: Task creation rejects blank tag name
- **WHEN** authenticated user sends POST /v1/tasks with `"tagNames": [""]` (or whitespace-only)
- **THEN** Bean Validation fails on the element constraint
- **AND** system returns 400 Bad Request with `{"error":"Validation failed","errors":{"tagNames":[...]}}` and creates neither task nor tags

#### Scenario: Task creation rejects oversized tag name
- **WHEN** authenticated user sends POST /v1/tasks with a `tagNames` element longer than 50 characters
- **THEN** Bean Validation fails on the element constraint
- **AND** system returns 400 Bad Request with `{"error":"Validation failed","errors":{"tagNames":[...]}}`
