# Spec Delta

## ADDED Requirements

### Requirement: Paginated Task Listing
When `page` and `size` query parameters are present, `GET /v1/tasks` SHALL return a page envelope `{"items": TaskResponse[], "page": number, "size": number, "total": number}`; the filters and sort from the listing requirement SHALL apply before pagination. `page` SHALL be `>= 0` and `size` SHALL be between 1 and 100; invalid values SHALL be rejected with 400 Bad Request carrying the structured `{error, errors}` body. When the parameters are absent, the response SHALL remain the plain array (unchanged).

**ID**: REQ-TM-011
**Affected files**:
- `com.example.todo.controller.TaskController.getAllTasks()` — optional `page`/`size`
- `com.example.todo.service.TaskService` — builds a `Pageable` and returns a page
- `com.example.todo.dto.PageResponse` — envelope record

#### Scenario: Paginated response envelope
- **WHEN** the user sends `GET /v1/tasks?page=0&size=20`
- **THEN** system returns 200 with `items` (at most 20), `page`, `size` and the total count

#### Scenario: No params keeps the array
- **WHEN** the user sends `GET /v1/tasks` without pagination params
- **THEN** system returns the plain array, unchanged

#### Scenario: Invalid pagination rejected
- **WHEN** the user sends `size=0`, `size=1000` or `page=-1`
- **THEN** system returns 400 Bad Request with `errors.page` or `errors.size`
