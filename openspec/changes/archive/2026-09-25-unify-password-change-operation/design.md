# Design — Unify password-change operation and error shape

## Context

Ver `proposal.md` (Why). Estado: `AuthController.resetChange:62-68` compara passwords y lanza `IllegalArgumentException`; `UserService.verifyResetToken:62-71` y `changePasswordViaReset:73-87` duplican lookup+expiración (`:68` vs `:80`); handler con 4 shapes (`:16-19` Void, `:46-51` `{error:es}`, `:31-39/:53-63` `Validation failed` con construcción duplicada, `:65-70` `{error:msg}`); duplicado de tag → `409` vacío (`:41-44`); `BCryptPasswordEncoder` como campo (`UserService:24`); `LocalDateTime.now()` en `:57,:68,:80`.

## Goals / Non-Goals

**Goals:** una operación de cambio que posee igualdad+validez; validez centralizada; un constructor de bodies; tiempo y hash inyectables.
**Non-Goals:** cambiar flujo/entropía/TTL; tocar Tag/Task/board.

## Decisions

1. **`changePasswordViaReset(token, newPassword, confirmPassword)` en el servicio** (vs `@AssertTrue` en el DTO). La igualdad es regla de dominio con mensaje de contrato (`"Passwords do not match"`); en el DTO quedaría atada a Bean Validation y al shape `Validation failed`, cambiando el contrato actual (`400 {error:msg}`). El controller delega y el `IllegalArgumentException` deja de usarse para este caso (se conserva el handler para otros usos).
2. **Helper `requireValidToken(token): User` interno** (vs duplicación). Verify y change lo usan; expiración con `Clock` inyectado (`Clock.systemUTC()` en prod, fijo en tests).
3. **Constructor `errorBody(msg)` + `validationBody(fieldErrors)` en el handler** (vs 4 construcciones). `403/404/409-tag` ganan `{error}` con mensajes estables nuevos: `403 {"error":"Forbidden"}`, `404 {"error":"Not found"}`, `409 tag {"error":"Tag already exists"}`. **BREAKING** de body documentado; códigos intactos; frontend mejora (ya lee `data.error`).
4. **Encoder como bean constructor-inyectado** (vs `new` en campo). Permite política testeable; sin cambio de algoritmo (BCrypt).
5. **Sin fake de hash/token store**. Igual que en B: segundo adapter solo por simetría sería seam hipotética; `Clock` + encoder inyectado dan la testabilidad sin over-engineering.

## Risks / Trade-offs

- [Bodies nuevos en 403/404/409-tag] → clientes que asertaban body vacío (buscar `andExpect(status()...)` sin body: pasan igual; solo rompería aserción de vacío, improbable). Frontend gana mensaje real.
- [`PasswordChangeDto` mantiene `confirmPassword`] → la igualdad se valida en servicio aunque el DTO la transporte; documentado como transporte, no regla.
- [Orden] → independiente de A/B/D; aplicable en paralelo.

## Migration Plan

Sin migraciones. Rollback: revert. Aplicable en paralelo a A y B.

## Test strategy

- `UserServiceTest`: mismatch → error sin tocar hash; expirado límite (reloj fijo ±60min); verify no consume (doble verify OK, change posterior OK).
- `GlobalExceptionHandlerTest`: unit para cada handler antes solo cubierto vía MockMvc (status-value, tag-409 con body, illegal-arg, reset 401s).
- `AuthControllerTest`/`ErrorContractIntegrationTest`: mismo contrato observable (códigos y mensajes), bodies nuevos en 403/404/409-tag.
- Gates: `docker compose up -d && cd backend && mvn test`.
