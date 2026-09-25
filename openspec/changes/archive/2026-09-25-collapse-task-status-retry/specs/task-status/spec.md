# Spec Delta — task-status (operación única documentada)

## MODIFIED Requirements

### Requirement: Task Update Includes Status
The system SHALL accept an optional `status` field in PUT requests to `/v1/tasks/{id}` and update the task's status accordingly. The status MUST transition atomically — only one status value may be stored per request. Both the full update (PUT) and the status-only update (PATCH) SHALL apply the status through the single status operation of the Task module (`applyStatus`), so both entry points share the same parsing and the same failure behavior. No second status operation exists on the module.

**ID**: REQ-STATUS-002
**Affected files**:
- `com.example.todo.service.TaskService.applyStatus(Long id, String status)` — single status operation; both entry points delegate to it (dead overload removed)
- `com.example.todo.controller.TaskController.updateTask()` / `patchStatus()` — thin delegates, no manual enum parsing

#### Scenario: Transition PENDING to ACTIVE
- **WHEN** user sends PUT request to `/v1/tasks/123` with `"status": "ACTIVE"` in the body
- **THEN** system updates task 123 to `status = ACTIVE`
- **AND** returns 200 OK with the updated task

#### Scenario: Transition ACTIVE to COMPLETED
- **WHEN** user sends PUT request to `/v1/tasks/123` with `"status": "COMPLETED"` in the body
- **THEN** system updates task 123 to `status = COMPLETED`
- **AND** returns 200 OK with the updated task

#### Scenario: Task response includes status
- **WHEN** user sends any request that returns a task object (GET, POST, PUT)
- **THEN** the returned JSON includes `"status": "<value>"` in every response

#### Scenario: PUT with invalid status rejected with field-level details
- **WHEN** user sends PUT request to `/v1/tasks/123` with `"status": "INVALID"` in the body
- **THEN** system returns 400 Bad Request with field-level details `{"error":"Validation failed","errors":{"status":["Status must be PENDING, ACTIVE or COMPLETED"]}}`
- **AND** the task is not modified
