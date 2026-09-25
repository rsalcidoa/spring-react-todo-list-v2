# Proposal — Shallow-edge cleanup batch

## Why

Varios bordes pasan el deletion test y son seam hipotética: `AuthService.registerUser` (1 línea, 1 caller) existe solo como indirección; `AuthController.register` devuelve el DTO de request con `"[REDACTED]"` mintiendo sobre el shape; y los fallos de login (`BadCredentialsException`) fugan fuera de la seam documentada (500/403 Spring) mientras `LoginPage` ya muestra `'Invalid email or password'` por su cuenta. `validateEmail` (3 callers) y `ProtectedRoute` se revisaron y se quedan: el primero tiene `leverage` real, el segundo lo exige el router.

## What Changes

- `frontend/src/services/AuthService.ts` eliminado; `RegisterPage` llama `api.post('/auth/register', …)` directo (misma instancia compartida). Tests actualizados al nuevo import.
- `AuthController.register` devuelve `RegisterResponse(email)` propio (`{"email"}`, sin campo redactado) en vez de reutilizar `RegisterRequest`.
- `GlobalExceptionHandler`: `AuthenticationException` (Spring Security, padre de `BadCredentialsException`) → `401 {error: "Invalid email or password"}` — el mensaje que el frontend ya muestra, ahora poseído por el backend.
- Sin cambios en `validateEmail` (leverage ×3 callers) ni `ProtectedRoute` (exigido por el router): revisados y conservados, documentado aquí.

## Capabilities

### New Capabilities

(Ninguna.)

### Modified Capabilities

- `user-authentication`: User Registration (response DTO propio), User Login (credenciales inválidas → 401 con mensaje).
- `frontend-integration`: Registration Page Route (nota: `registerUser` inlined a `api.post`; sin cambio de escenarios).

## Impact

- Módulos: `frontend/src/services/AuthService.ts` (delete), `frontend/src/pages/RegisterPage.tsx`, `frontend/src/__tests__/RegisterPage.test.tsx`, `com.example.todo.controller.AuthController`, `com.example.todo.exception.GlobalExceptionHandler`, tests `AuthControllerTest`, `ErrorContractIntegrationTest`.
- **BREAKING** menor e intencional: `POST /v1/auth/register` deja de incluir el campo `password` redactado (si se decide reducir — ver Decisions); `POST /v1/auth/login` con credenciales malas pasa de 500/403 por defecto a `401 {error}`.
- Independiente de A, B, C (ficheros disjuntos: B no toca `AuthenticationException` ni `AuthController.register`).

## Non-goals

- `validateEmail`, `ProtectedRoute`: revisados, se quedan.
- `JwtUtil`/filtro (cambio B), `""` silencioso (ya cubierto por REQ-PR-001 y `mapApiError`; la rama `token.length>0` del frontend es lógica UI correcta).
- Refresh tokens.

## Rollback plan

Revert del commit. Sin migraciones; rollback seguro.
