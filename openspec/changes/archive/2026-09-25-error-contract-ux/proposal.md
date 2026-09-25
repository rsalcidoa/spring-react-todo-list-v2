# Proposal — One error contract end-to-end

## Why

La misma seam HTTP emite cinco shapes: 401 vacío (handler `Unauthenticated` y entryPoint de `SecurityConfig`), 401 con body (reset), 400 `Validation failed`, 400 plano (`IllegalArgumentException`), 409 inglés/español. El filtro JWT traga excepciones y sigue sin auth, así que un token corrupto termina en 401 vacío del entryPoint en vez de un error declarado. Cada caller del frontend adivina (`ResetPasswordPage` compara literales, el modal define fallbacks propios). No hay tests de `JwtUtil`/filtro/`SecurityConfig`.

## What Changes

- `GlobalExceptionHandler`: `UnauthenticatedException` → `401 {error: "Authentication required"}` vía `errorBody` existente; `IllegalArgumentException` se mantiene como `400 {error:msg}` (documentado como fallback, no como contrato de validación).
- `SecurityConfig` entryPoint → `401 {error: "Authentication required"}` (mismo mensaje, JSON).
- `JwtAuthenticationFilter`: no tragar a ciegas — solo `validateToken()==false` o usuario inexistente se ignoran y siguen sin auth (comportamiento conservado pero declarado); errores inesperados se propagan al entryPoint en vez de silenciarse. Sin cambio de códigos.
- `JwtUtil`: charset consistente (`UTF_8` en los tres usos de `secret.getBytes()`); sin cambio de algoritmo.
- Tests nuevos: `JwtUtilTest` (generate/validate/extract/expiry/tamper), filtro (token válido autentica, inválido sigue sin auth, error inesperado no se silencia), entryPoint con body.
- Frontend: `ResetPasswordPage` deja de comparar literales y usa `mapApiError`/`toDisplayMessage`; `TAG_ERROR_FALLBACKS` del modal se revisa contra el contrato (sin cambiar textos visibles salvo que el contrato lo exija).

## Capabilities

### New Capabilities

(Ninguna.)

### Modified Capabilities

- `user-authentication`: REQ-UAC-001 — el `401` sin usuario autenticado lleva body `{error: "Authentication required"}` (mismo código).
- `password-reset`: REQ-PR-002/003 — sin cambio de escenarios; solo nota de que el 401 de reset ya era coherente y ahora toda la seam lo es.
- `frontend-integration`: API Integration — los callers consumen una sola forma de error (nota de interface).

## Impact

- Módulos: `com.example.todo.exception.GlobalExceptionHandler`, `com.example.todo.config.SecurityConfig`, `com.example.todo.config.JwtAuthenticationFilter`, `com.example.todo.util.JwtUtil`, tests nuevos, `frontend/src/pages/ResetPasswordPage.tsx`, quizá `components/AddTaskModal.tsx` (fallbacks).
- **BREAKING** de body (intencional): 401 vacío → `401 {error: "Authentication required"}` en handler y entryPoint. Códigos intactos. Frontend mejora (ya lee `data.error`).
- Idioma 409 (inglés tag / español email) se mantiene por decisión previa; fuera de alcance unificarlo.
- Cambio mediano (3 ficheros productivos + tests); no requiere split. Independiente de A, C, D.

## Non-goals

- Unificar idioma de mensajes 409.
- Refresh tokens, expiración client-side (ver cambio A si aplica).
- Ownership (cambio C), bordes shallow (cambio D), módulo sesión (cambio A).

## Rollback plan

Revert del commit. Sin migraciones; rollback seguro.
