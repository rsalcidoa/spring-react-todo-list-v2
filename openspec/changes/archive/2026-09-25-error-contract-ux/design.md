# Design — One error contract end-to-end

## Context

Ver `proposal.md` (Why). Estado: handler con builders `errorBody`/`validationBody` ya unificados salvo `Unauthenticated→401` vacío (`GlobalExceptionHandler.java:26-29`); entryPoint en `SecurityConfig` devuelve 401 vacío; `JwtAuthenticationFilter.java:44-46` traga `Exception`; `JwtUtil` mezcla `secret.getBytes()` sin charset (`:34,43,51`) vs `UTF_8` en `init:18`; frontend `ResetPasswordPage:32-42` compara literales, `AddTaskModal:18-22` define fallbacks propios.

## Goals / Non-Goals

**Goals:** todo 401 con el mismo body; filtro honesto (solo invalidez conocida se ignora); `JwtUtil` testeado; frontend sin literales.
**Non-Goals:** idioma 409; refresh tokens; cambiar códigos.

## Decisions

1. **`401 {error: "Authentication required"}` en handler + entryPoint** (vs mantener vacío). Mismo mensaje en ambos puntos para que el caller no distinga el origen; el interceptor del cambio A y `mapApiError` ya leen `data.error`. **BREAKING** de body documentado.
2. **Filtro: ignorar solo invalidez declarada** (vs tragar `Exception`). `validateToken()==false` o `UsernameNotFoundException` → seguir sin auth (comportamiento conservado); cualquier otra excepción se propaga al entryPoint. Así un bug (p. ej. DB caída) no se disfraza de "sin auth".
3. **Charset `UTF_8` en los tres `getBytes()`** (vs dejar el default). En la mayoría de plataformas coincide, pero el init ya exige UTF-8: coherencia sin cambio de comportamiento.
4. **Frontend: `ResetPasswordPage` vía `mapApiError`** (vs literales). Compara `code` (`not-found`/`validation`/expirado por mensaje `data.error` existente) en vez de strings hardcodeados; `TAG_ERROR_FALLBACKS` se mantiene salvo que el contrato lo contradiga.

## Risks / Trade-offs

- [Tests que aserten 401 vacío] → buscar `isUnauthorized` + body vacío en backend/frontend y actualizarlos (parte de las tasks).
- [Filtro que ahora propaga] → solo errores inesperados llegan al entryPoint como 401 con body; antes eran 401 vacío. Mismo código, mejor diagnóstico.
- [Orden] → independiente de A, C, D; toca `SecurityConfig` que nadie más toca en esta tanda.

## Migration Plan

Sin migraciones. Rollback: revert. Independiente del resto.

## Test strategy

- `JwtUtilTest` nuevo: generate→validate→extract roundtrip, token expirado rechaza, token manipulado rechaza, secreto corto falla en `init`.
- Filtro: token válido → autenticado; inválido → sigue sin auth; error inesperado (mock que lanza `RuntimeException` no-auth) → propaga.
- Handler/entryPoint: 401 con body en ambos (MockMvc sin token + unit).
- Frontend: `ResetPasswordPage` sin literales; suite verde.
- Gates: `docker compose up -d && cd backend && mvn test`; `cd frontend && npx vitest run && npm run build`.
