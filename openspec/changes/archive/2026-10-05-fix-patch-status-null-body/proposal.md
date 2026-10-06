# Proposal

## Why

The unified API error contract requires `PATCH /v1/tasks/{id}/status` to answer a missing/null body with the same structured field-level 400 as an empty status (`task-status` REQ-STATUS-004). Today the controller requires a body, so a body-less request is intercepted by Spring with a generic 400 body, breaking clients that rely on the `{error, errors}` shape.

## What Changes

- Make `PATCH /v1/tasks/{id}/status` accept an optional body. A missing body is treated as a blank `status` and rejected through the existing typed failure, producing `{"error":"Validation failed","errors":{"status":["Status must not be blank"]}}`.
- Harden the null-body integration test to assert the exact contract body, not only the 400 status.

**Non-goals:**
- Not changing how malformed/absent JSON bodies are handled on other endpoints.
- Not changing PUT, status filtering, or valid PATCH behavior.
- No new dependencies.

**Rollback plan:** revert the controller change and the test assertions; the previous generic-400 behavior returns. No data migration involved.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. This aligns the implementation with the existing `task-status` REQ-STATUS-004 contract; no spec-level behavior changes, so the change sets `skip_specs: true`.

## Impact

- **Backend (Java):** `com.example.todo.controller.TaskController.patchStatus` (`@RequestBody(required = false)` plus an explicit typed failure). `com.example.todo.exception.GlobalExceptionHandler` is reused unchanged.
- **Tests (Java):** `backend/src/test/java/com/example/todo/ErrorContractIntegrationTest.java`.
- **API:** no breaking change for callers that send a valid body; strictly more conformant error body for the body-less case.
