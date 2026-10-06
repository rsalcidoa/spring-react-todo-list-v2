# Design

## Context

See `proposal.md` — Why. `AuthController` declares four response records inline; every other response type lives in `com.example.todo.dto`. The frontend already has typed error helpers (`frontend/src/data/TaskRepository.ts`) and `session`/`api` typing. `TagService.resolve` guards blank names that the `TaskRequest` DTO already rejects.

## Goals / Non-Goals

**Goals:**
- Homogeneous DTO placement and no raw `any` in the touched code.
- No path where an internal invariant produces a misleading client contract.

**Non-Goals:**
- Broad `any` cleanup or DTO reorganization beyond the auth responses.

## Decisions

1. **Move all four auth response records to `dto`** (chosen) rather than only `RegisterResponse`.
   - Rationale: fixes the inconsistency once instead of introducing a new one-off.
   - Alternative: move only `RegisterResponse` — rejected: leaves the same drift in sibling records.
2. **`unknown` + typed helper in `RegisterPage`** (chosen).
   - Rationale: keeps one error interpretation; matches the "no `any`" policy.
   - Alternative: `catch (error)` and inline casts — rejected as ad-hoc.
3. **TagService guard → internal invariant signal** (chosen), e.g. `IllegalStateException`, not a client-mapped `IllegalArgumentException`.
   - Rationale: the controller DTO enforces non-blank, so reaching it is a programming error, not a 400.
   - Alternative: remove the guard — rejected: loses the safety net for direct service calls.

## Risks / Trade-offs

- [Moving records changes imports/tests] → compile-and-test step catches all references.
- [Changing the guard exception type] → no HTTP path reaches it today; a service-level test documents the invariant.

## Test Strategy

- Backend: `mvn test` (auth controller and tag service tests) must stay green; add/adjust a service test if the guard is asserted.
- Frontend: `npm test -- --run` and `npm run build` must stay green; TypeScript strict build catches the removed `any`.
