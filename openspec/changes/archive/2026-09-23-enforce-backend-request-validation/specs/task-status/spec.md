# Spec Delta — task-status

## ADDED Requirements

### Requirement: PATCH Status Update Endpoint

The system SHALL accept PATCH requests to `/v1/tasks/{id}/status` with a `{"status": "VALUE"}` body. The status field MUST be validated with `@NotBlank` and must match one of the three allowed enum values (`PENDING`, `ACTIVE`, `COMPLETED`).

**ID**: REQ-STATUS-004
**Affected files**: 
- `com.example.todo.controller.TaskController.patchStatus()` — parameter `@Valid @RequestBody StatusUpdateRequest request` (added `@Valid`)
- `com.example.todo.dto.StatusUpdateRequest.java` — `@NotBlank(message = "Status must not be blank")` already present

#### Scenario: Valid PATCH status update succeeds
- **WHEN** authenticated user sends PATCH request to `/v1/tasks/{id}/status` with `{"status": "ACTIVE"}` for a valid task they own
- **THEN** system returns 200 OK with the updated task including `"status": "ACTIVE"`

#### Scenario: PATCH status blank rejected
- **WHEN** user sends PATCH request to `/v1/tasks/{id}/status` with `{"status": ""}` (empty string) or null body
- **THEN** system returns 400 Bad Request with field-level details `{"error":"Validation failed","errors":{"status":["Status must not be blank"]}}`

#### Scenario: PATCH invalid status value rejected
- **WHEN** user sends PATCH request to `/v1/tasks/{id}/status` with `{"status": "INVALID"}` (not a valid enum)
- **THEN** system returns 400 Bad Request with field-level details
