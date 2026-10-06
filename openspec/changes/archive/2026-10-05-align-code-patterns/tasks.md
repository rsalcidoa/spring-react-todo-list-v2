# Tasks

## 1. Frontend typing

- [x] 1.1 Replace `catch (error: any)` in `RegisterPage` with `unknown` plus the typed error helper; verify `npm run build` (TypeScript strict) and `npm test -- --run -- RegisterPage` pass.

## 2. Backend DTO placement

- [x] 2.1 Create `com.example.todo.dto.LoginResponse`, `RegisterResponse`, `ResetRequestResponse`, `VerifyResponse` as records and remove the nested records from `AuthController`; update imports/references; verify `mvn -q compile`.
- [x] 2.2 Update any tests referencing the nested records; verify `mvn test` passes.

## 3. Tag guard

- [x] 3.1 Change the blank-name guard in `TagService.resolve` from `IllegalArgumentException` to an internal invariant exception; verify `mvn -Dtest=TagServiceTest test` passes (adjust the guard test if present).

## 4. Verify

- [x] 4.1 Run `mvn test`, `npm test -- --run`, and `npm run build`; confirm all green (depends on groups 1–3).
