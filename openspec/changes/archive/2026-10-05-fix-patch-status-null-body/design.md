# Design

## Context

See `proposal.md` — Why. `TaskController.patchStatus` uses `@Valid @RequestBody StatusUpdateRequest`; a body-less request raises `HttpMessageNotReadableException`, handled by Spring's default resolver because `GlobalExceptionHandler` only maps `MethodArgumentNotValidException`. The existing `InvalidStatusValueException("status", msg)` already maps to the exact contract body.

## Goals / Non-Goals

**Goals:**
- A body-less `PATCH /v1/tasks/{id}/status` yields `{"error":"Validation failed","errors":{"status":["Status must not be blank"]}}`.

**Non-Goals:**
- A global `HttpMessageNotReadableException` handler (the field key would be unknown and it would affect every endpoint).

## Decisions

1. **`@RequestBody(required = false)` plus an explicit typed failure** (chosen).
   - Rationale: reuses the single status operation's failure and the existing handler; keeps the `status` key exact.
   - Alternative: global `HttpMessageNotReadableException` handler — rejected because it cannot attribute a field and would change other endpoints' contracts.
   - Alternative: a controller-scoped advice — rejected as more machinery for the same result.

## Risks / Trade-offs

- [A body-less PATCH now reaches application code] → the explicit null check throws before any work; covered by an integration test.

## Test Strategy

- Integration (MockMvc): `ErrorContractIntegrationTest` asserts status 400 and the exact `$.error` / `$.errors.status[0]` values.
- Regression: the full backend `mvn test` suite must stay green.
