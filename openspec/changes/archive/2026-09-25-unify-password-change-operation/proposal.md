# Proposal — Unify password-change operation and error shape

## Why

La regla `confirmPassword` vive en `AuthController.resetChange` (el módulo User ni la recibe), el lookup+expiración del token está duplicado en `verifyResetToken`/`changePasswordViaReset`, y la misma seam HTTP emite cuatro shapes (`403/404/409-tag` vacíos vs `{error}` vs `Validation failed`). El frontend espera `data.error` y cae a `'Error'` genérico. `BCryptPasswordEncoder` inline y `LocalDateTime.now()` fijo dejan la política sin seam testeable.

## What Changes

- `UserService.changePasswordViaReset(token, newPassword, confirmPassword)` posee igualdad + validez del token en una sola operación; `AuthController.resetChange` queda como delegate delgado (igual que `TagController` tras el cambio B).
- Lookup+expiración colapsan a un helper interno único ("token válido") usado por verify y change.
- `GlobalExceptionHandler`: un constructor de body compartido para `{error}` y `Validation failed`; los handlers vacíos ganan body `{error}` coherente (cambio de body, no de código).
- Reloj inyectable (`Clock`) y encoder como bean/dependencia para testear expiración y política sin tiempo real.

## Capabilities

### New Capabilities

(Ninguna.)

### Modified Capabilities

- `password-reset`: REQ-PR-003 — igualdad exigida por la operación del módulo (no por el controller); REQ-PR-002 — validez centralizada.
- `user-authentication`: REQ-UA-002 referencia (sin texto propio; hereda).

## Impact

- Módulos: `com.example.todo.service.UserService`, `com.example.todo.controller.AuthController`, `com.example.todo.exception.GlobalExceptionHandler`, `com.example.todo.dto.PasswordChangeDto` (quizá `@AssertTrue` o se mantiene validación en servicio — decisión en design), tests `UserServiceTest`, `AuthControllerTest`, `GlobalExceptionHandlerTest`, `ErrorContractIntegrationTest`.
- APIs: `PUT /v1/auth/reset-change` con mismatch sigue `400 "Passwords do not match"` (mismo código y mensaje, ahora desde el módulo); `403/404/409-tag` ganan body `{error}` (**BREAKING** de body, intencional y documentado; frontend lo consume mejor).
- Independiente de B y D (no comparten ficheros salvo `GlobalExceptionHandler` con nadie). Puede aplicarse en paralelo a A y B.

## Non-goals

- Cambiar el flujo reset (token de 6 chars, TTL 1h, silent `""`) — ya canónico.
- Rotar a tokens hasheados/entropía mayor (endurecimiento futuro, fuera de alcance).
- Módulos Tag/Task/board (cambios A, B, D).

## Rollback plan

Revert del commit. Sin migraciones; rollback seguro.
