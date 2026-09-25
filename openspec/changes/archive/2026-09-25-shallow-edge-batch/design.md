# Design — Shallow-edge cleanup batch

## Context

Ver `proposal.md` (Why). Estado: `AuthService.ts:2-5` con 1 caller (`RegisterPage.tsx:27`); `AuthController.register:36-40` retorna `RegisterRequest` con `"[REDACTED]"`; login con credenciales malas cae al default Spring (verificado: ningún `@ExceptionHandler` para `AuthenticationException`); `LoginPage.tsx:27-29` muestra `'Invalid email or password'`; ningún test aserta el body de `POST /v1/auth/register` (solo `201`).

## Goals / Non-Goals

**Goals:** bordes honestos (DTO propio, 401 declarado), menos indirección hipotética.
**Non-Goals:** `validateEmail`/`ProtectedRoute` (se quedan, ver proposal); JwtUtil/filtro (cambio B).

## Decisions

1. **Borrar `AuthService.ts`, `api.post` directo en `RegisterPage`** (vs mover a otro módulo). Un caller + una línea = deletion test superado; la instancia compartida ya vive en `ApiService`. `RegisterPage.test` mockea `api` de `ApiService` (patrón ya usado en otros tests).
2. **`RegisterResponse(email)` y JSON `{"email"}`** (vs conservar el campo redactado). Nada aserta el campo `password:"[REDACTED]"` (grep: tests solo `201`, frontend solo `await`); el campo mentía sobre el shape. **BREAKING** menor documentado.
3. **`AuthenticationException` → 401 en el handler** (vs `BadCredentialsException` solo). El padre cubre `BadCredentials`, `Disabled`, `Locked`, `UsernameNotFound` con un solo handler; mensaje único `"Invalid email or password"` (el que el frontend ya muestra — ahora el backend lo posee). Va después de handlers específicos; Spring lo resuelve por especificidad igual.
4. **`validateEmail`/`ProtectedRoute` se quedan**. Tres callers = `leverage` real; el router exige elemento. Sin cambios.

## Risks / Trade-offs

- [Cliente que lea `password` del 201] → grep muestra ninguno; aceptado.
- [`AuthenticationException` también cubre `InternalAuthenticationServiceFailure`] → un fallo interno (DB) daría 401 en vez de 500. Aceptado y documentado: el filtro (cambio B) ya distingue lo inesperado; aquí la alternativa (enumerar subclases) añade handlers sin `depth`.
- Ninguna migración; rollback por revert.

## Migration Plan

Sin migraciones. Rollback: revert. Independiente de A, B, C.

## Test strategy

- `AuthControllerTest`/`ErrorContractIntegrationTest`: register `201` con `{"email"}` sin `password`; login malo → `401 {error}` (MockMvc).
- `RegisterPage.test`: mock de `api.post`, auto-login intacto.
- Gates: `docker compose up -d && cd backend && mvn test`; `cd frontend && npx vitest run && npm run build`.
