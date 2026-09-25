# Spec Delta — tagging

## MODIFIED Requirements

### Requirement: Delete User Tag
**ID**: REQ-DUT-001
The system SHALL allow authenticated users to delete their own tags via DELETE request to `/v1/tags/{id}`. The tag must belong to the requesting user; attempting to delete another user's tag returns 403 Forbidden; deleting a tag id that does not exist returns 404 Not Found.

**Affected files**: `com.example.todo.controller.TagController.deleteTag()` — ownership decidido a través de `com.example.todo.security.CurrentUserProvider`; `com.example.todo.exception.GlobalExceptionHandler` — mapeo 403/404.

#### Scenario: Successful tag deletion
- **WHEN** authenticated user sends DELETE request to `/v1/tags/5` for a tag they own
- **THEN** system deletes the tag, unassigns it from all associated tasks, and returns 204 No Content

#### Scenario: Delete another user's tag forbidden
- **WHEN** unauthenticated or different authenticated user sends DELETE request to `/v1/tags/5` for a tag owned by someone else
- **THEN** system returns 403 Forbidden

#### Scenario: Delete of a non-existent tag returns 404
- **WHEN** authenticated user sends DELETE request to `/v1/tags/9999` for an id that does not exist
- **THEN** system returns 404 Not Found

### Requirement: Tag Ownership Enforcement
**ID**: REQ-TOE-001
The system SHALL only allow the owning user to create, list, update, or delete tags. Every tag operation must verify that the authenticated user is the tag owner before processing. The ownership verification is centralized in the same current-user seam used by tasks, so tag and task ownership decisions cannot drift apart.

**Affected files**: `com.example.todo.security.CurrentUserProvider` — nuevo; `com.example.todo.controller.TagController` — usa la seam para la verificación de ownership.

#### Scenario: Unauthorized user cannot access another's tags
- **WHEN** user A attempts GET `/v1/tags` after authenticating as user B via token
- **THEN** system returns only tags owned by user B, not user A (or returns 403 if the API is scoped per-user)
