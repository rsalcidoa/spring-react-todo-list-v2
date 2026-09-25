# Spec Delta — task-management (escenario de filtro inválido)

## MODIFIED Requirements

### Requirement: List All Tasks
The system SHALL allow users to retrieve all tasks. The endpoint now supports an optional `status` query parameter for filtering results. When no filter is specified, behavior remains unchanged (returns all tasks). An invalid `status` value is rejected with 400 Bad Request carrying structured field-level details (see task-status Column Filtering).

#### Scenario: Successful Task Listing
- **WHEN** user sends GET request to /v1/tasks
- **THEN** system returns 200 OK with array of all tasks (all statuses)

#### Scenario: Filtered Task Listing by Status
- **WHEN** user sends GET request to /v1/tasks?status=PENDING
- **THEN** system returns 200 OK with an array containing only tasks matching the `PENDING` status filter

#### Scenario: Invalid Status Filter Rejected
- **WHEN** user sends GET request to /v1/tasks?status=INVALID
- **THEN** system returns 400 Bad Request with `{"error":"Validation failed","errors":{"status":["Status must be PENDING, ACTIVE or COMPLETED"]}}`
