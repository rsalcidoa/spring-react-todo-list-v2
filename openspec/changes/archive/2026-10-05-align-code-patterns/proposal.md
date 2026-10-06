# Proposal

## Why

Verification flagged three pattern drifts: `RegisterPage` uses a raw `catch (error: any)`; the auth response DTOs are nested records inside `AuthController` instead of the `dto` package used everywhere else (the spec refers to `RegisterResponse` as a DTO); and `TagService.resolve` can throw an `IllegalArgumentException` whose HTTP body shape diverges from the validation contract if ever reached.

## What Changes

- Replace the `any` in `RegisterPage`'s catch with the existing typed error helpers (`getApiStatus` / `toDisplayMessage` style) or `unknown` narrowing.
- Move the auth response records `LoginResponse`, `RegisterResponse`, `ResetRequestResponse`, `VerifyResponse` from nested records in `AuthController` into `com.example.todo.dto`, and update references.
- Convert the unreachable blank-name guard in `TagService.resolve` from `IllegalArgumentException` (which the handler maps to a divergent client 400 body) to an internal invariant signal, since the request DTO already enforces non-blank.

**Non-goals:**
- No externally observable behavior change; no endpoint, JSON shape, or status-code change.
- Not touching unrelated `any` usages or other modules.

**Rollback plan:** revert the moved DTOs and the two small edits; pure source refactor with no data migration.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. Pure refactor; no spec-level behavior changes, so `skip_specs: true` is set.

## Impact

- **Frontend (TS):** `frontend/src/pages/RegisterPage.tsx`.
- **Backend (Java):** `com.example.todo.controller.AuthController`, new `com.example.todo.dto.{LoginResponse,RegisterResponse,ResetRequestResponse,VerifyResponse}`, `com.example.todo.service.TagService`.
- **Tests:** any references to the nested records (`backend/src/test/...`) updated.
