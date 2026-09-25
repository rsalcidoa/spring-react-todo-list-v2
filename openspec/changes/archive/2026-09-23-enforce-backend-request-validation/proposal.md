# Proposal: Enforce backend request validation

## Why

El endpoint `TaskController.patchStatus()` (línea 113) no tiene `@Valid` en el parámetro `@RequestBody StatusUpdateRequest request`. Consecuencia: un body null o vacío pasa directamente a `TaskStatus.valueOf(request.getStatus())` → `request.getStatus()` es null → `TaskStatus.valueOf(null)` → `IllegalArgumentException` → sin handler → 500. El cuerpo de error existente (`catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(null); }`) devuelve un cuerpo null (sin detalles de campo).

Además, `RegisterRequest.password` tiene SOLO `@Size(min=6)` — le falta `@NotBlank(message = "Password must not be blank")`. Consecuencia: un password null pasa `@Size` (null-safe) → llega a `BCrypt.checkpw(null)` → NPE → 500.

La spec de `backend-validation` → "Registration Input Validation (REQ-BV-001)" ya especifica el cuerpo 400 con `@NotBlank(message = "Password must not be blank")` y field-level details; el handler de 400 de `establish-api-error-contract` (C5) ya lo mapea. C4/C5 son compliance pura: añadir los `@NotBlank`/`@Valid` que faltan para cumplir el contrato existente.

## What Changes

- **`RegisterRequest.java`**: añadir `@NotBlank(message = "Password must not be blank")` junto a `@Size(min=6)` en el campo `password`.
- **`TaskController.java`**: añadir `@Valid` al parámetro `StatusUpdateRequest request` en `patchStatus()`.
- **`task-status` → ADDED Requirement**: "PATCH Status Update Endpoint" — escenario PATCH válido → 200; status blank/missing → 400 con field-level details; valor inválido → 400.
- **Tests**: extender `GlobalExceptionHandlerTest`/`ErrorContractIntegrationTest` (de C5) con: register password null → 400 + `errors.password`; PATCH body null → 400 (interceptado por handler); PATCH `{"status":""}` → 400 + `errors.status`; PATCH `{"status":"INVALID"}` → 400; PATCH válido → 200.

## Non-goals

- No hay cambios de frontend (los errores 400 ya se muestran en C3).
- No hay cambios de esquema DB.
- No se añaden validaciones adicionales a otros DTOs (`LoginRequest`, `TaskRequest` ya tienen `@Valid`).

## Capabilities

### Modified Capabilities

- (ninguna — compliance con `backend-validation` ya existente, sin delta en esa spec)

### New Capabilities

- **task-status**: `PATCH Status Update Endpoint` (ADDED) — cubrir el endpoint PATCH `/v1/tasks/{id}/status` con sus 3 escenarios (válido, blank, inválido).

## Impact

| Capa | Módulos afectados |
|------|-------------------|
| **Backend Java** | `com.example.todo.dto.RegisterRequest` (+`@NotBlank` en password), `com.example.todo.controller.TaskController` (+`@Valid` en patchStatus) |
| **Frontend TS** | ninguno |
| **Dependencias** | ninguna nueva |
| **API** | PATCH `/v1/tasks/{id}/status` con body null/blank → 400 con field-level details (antes 500); PATCH `{"status":"INVALID"}` → 400 (ya lo hacía, pero ahora con cuerpo estructurado); body válido → 200 (sin cambios) |

## División del cambio (regla >3 archivos)

Este cambio toca ~2 archivos + 1 spec delta. Se consideró dividir en (a) `RegisterRequest` y (b) `TaskController`, pero ambos cambios son complementarios (ambos son `@NotBlank`/`@Valid` para compliance); separarlos dejaría un estado incompleto donde un campo es válido y otro no. Decisión: un solo cambio con 2 tareas.

## Rollback Plan

- Revertir el commit restaura el comportamiento anterior (password sin `@NotBlank`, patchStatus sin `@Valid`). No hay esquema que revertir: solo código Java.
