# Tasks

## 1. Fix PATCH contract

- [x] 1.1 Change `TaskController.patchStatus` to `@RequestBody(required = false)` and throw `InvalidStatusValueException("status", "Status must not be blank")` when the body is null; verify `mvn -Dtest=ErrorContractIntegrationTest test` passes after task 1.2.
- [x] 1.2 Harden `ErrorContractIntegrationTest.patchStatusWithNullBodyReturns400` to assert `$.error == "Validation failed"` and `$.errors.status[0] == "Status must not be blank"`; verify `mvn -Dtest=ErrorContractIntegrationTest test`.

## 2. Verify

- [x] 2.1 Run the full backend suite `mvn test` and confirm 0 failures (depends on 1.1, 1.2).
