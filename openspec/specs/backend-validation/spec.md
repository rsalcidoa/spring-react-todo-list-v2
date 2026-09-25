# backend-validation Specification

## Purpose
Adds Bean Validation constraints to all request DTOs in the backend, ensuring that unvalidated inputs (empty strings, malformed emails, short passwords) are rejected with proper 400 Bad Request responses containing structured error details before they reach service layer logic.

## Requirements

### Requirement: Registration Input Validation (REQ-BV-001)
The system SHALL validate all fields of the registration request DTO using Bean Validation annotations (`@NotBlank`, `@Email`, `@Size(min=6)`). Invalid registration requests shall receive a 400 Bad Request response with field-level error details.

**Affected files**: 
- `com.example.todo.dto.RegisterRequest.java` — add `@NotBlank(message = "Email must not be blank") @Email(message = "Must be a valid email address")` to email; add `@NotBlank(message = "Password must not be blank") @Size(min=6, message = "Password must be at least 6 characters")` to password
- `com.example.todo.controller.AuthController.register()` — accept request body annotated with `@Valid`

#### Scenario: Successful registration passes validation
- **WHEN** user sends POST /v1/auth/register with valid email format and 6+ character non-empty password
- **THEN** Bean Validation passes
- **AND** system returns 201 Created with redacted user data (email only)

#### Scenario: Registration rejects empty email
- **WHEN** user sends POST /v1/auth/register with empty or null email field
- **THEN** Bean Validation fails on `@NotBlank` constraint for email
- **AND** system returns 400 Bad Request with error details containing validation message for email field

#### Scenario: Registration rejects invalid email format
- **WHEN** user sends POST /v1/auth/register with malformed email (e.g., "notanemail")
- **THEN** Bean Validation fails on `@Email` constraint for email
- **AND** system returns 400 Bad Request with error details containing validation message for email field

#### Scenario: Registration rejects short password
- **WHEN** user sends POST /v1/auth/register with password shorter than 6 characters
- **THEN** Bean Validation fails on `@Size(min=6)` constraint for password
- **AND** system returns 400 Bad Request with error details containing validation message for password field

### Requirement: Login Input Validation (REQ-BV-002)
The system SHALL validate the login request DTO with `@NotBlank` on email and password plus `@Email` on email. Login intentionally carries no `@Size` minimum on password: a short but non-blank password passes validation and fails later with 401 from authentication. Invalid login requests with blank fields shall receive a 400 Bad Request response instead of attempting authentication with empty data.

**Affected files**: 
- `com.example.todo.dto.LoginRequest.java` — add `@NotBlank(message = "Email must not be blank") @Email(message = "Must be a valid email address")` to email; add `@NotBlank(message = "Password must not be blank")` to password
- `com.example.todo.controller.AuthController.login()` — accept request body annotated with `@Valid`

#### Scenario: Successful login passes validation
- **WHEN** user sends POST /v1/auth/login with valid registered email and non-empty password
- **THEN** Bean Validation passes
- **AND** system proceeds to authentication manager and returns JWT token if credentials are correct

#### Scenario: Login rejects empty fields
- **WHEN** user sends POST /v1/auth/login with any blank or null required field (email or password)
- **THEN** Bean Validation fails on `@NotBlank` constraint(s) for the violated field(s)
- **AND** system returns 400 Bad Request with error details listing all validation failures

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
