# Proposal: Establish API error contract

## Why

La API devuelve errores con cuerpos inconsistentes: `UserService.register()` lanza `IllegalArgumentException` crudo para email duplicado (→500 en vez de 409), `RegisterPage.tsx` muestra un `alert()` genérico sin leer el cuerpo de error, y `TaskController.patchStatus()` no tiene `@Valid` → body null → NPE → 500. Las specs existentes (`user-authentication` → "Registration With Duplicate Email Fails Gracefully", `backend-validation` → "Registration Input Validation (REQ-BV-001)") ya exigen 409 con mensaje y validación 400 con detalles por campo, pero la implementación actual no los cumple. El `GlobalExceptionHandler` creado en el cambio 1 mapea solo 401/403/404 (cuerpos vacíos). C5 lo extiende para cubrir 409 (email duplicado) y 400 (validación), estableciendo un contrato JSON uniforme.

Además, la spec de `task-management` → "Task Due Date" indica timestamp `2024-12-31T23:59:59Z` cuando la implementación usa `LocalDate` con columna `date` y `<input type="date">` → `yyyy-MM-dd`. Hay que corregir la spec para reflejar el formato date-only.

## What Changes

- **Nueva excepción `UserAlreadyExistsException`** (runtime) en `com.example.todo.exception`. `UserService.register()`: pre-check `existsByEmail` → la lanzará; envolver `userRepository.save(user)` con catch `DataIntegrityViolationException` → re-lanzarla (carrera).
- **Extender `GlobalExceptionHandler`**: `UserAlreadyExistsException`→409 `{"error":"Este email ya está registrado"}`; `MethodArgumentNotValidException`→400 `{"error":"Validation failed","errors":{<campo>:[mensajes]}}` (agrupar `getFieldErrors()` por campo).
- **Actualizar `user-authentication` → "User Registration with Auto-login"**: endurecer el escenario "Registration With Duplicate Email Fails Gracefully" a 409 con cuerpo JSON explícito y el mensaje "Este email ya está registrado".
- **Actualizar `task-management` → "Task Due Date"**: corregir el scenario "Successful Task Creation with Due Date" de timestamp `2024-12-31T23:59:59Z` a date-only `2024-12-31` (coherencia con `LocalDate`, columna `date`, `<input type="date">`).
- **Tests**: extender `GlobalExceptionHandlerTest` (de C1) con 409/400; nuevo `ErrorContractIntegrationTest` — re-register → 409 + mensaje; password <6 → 400 + `errors.password`; email malformado → 400 + `errors.email`; login email vacío → 400 + `errors.email`; create task `dueDate:"2024-12-31"` → 201 + eco date.

## Non-goals

- No se añaden `@NotBlank`/`@Valid` a `RegisterRequest`, `LoginRequest`, `StatusUpdateRequest` → `enforce-backend-request-validation` (C5).
- No hay cambios de frontend beyond los casos de error 409/400 → `unify-frontend-http-client` (C3).
- No se migra la columna `date` a `timestamp`: ADR a favor de mantener date-only (`LocalDate`).
- No se añade handler genérico `DataIntegrityViolationException`→409 (false-positive con la unique de tags de C3).

## Capabilities

### Modified Capabilities

- **user-authentication**: `User Registration with Auto-login` — escenario "Registration With Duplicate Email Fails Gracefully" endurecido a 409 con cuerpo JSON `{"error":"Este email ya está registrado"}`.
- **task-management**: `Task Due Date` — scenario corregido a date-only `2024-12-31`.

### New Capabilities

- (ninguna)

## Impact

| Capa | Módulos afectados |
|------|-------------------|
| **Backend Java** | `com.example.todo.exception.UserAlreadyExistsException` (nuevo), `com.example.todo.service.UserService`, `com.example.todo.exception.GlobalExceptionHandler` (extendido) |
| **Frontend TS** | ninguno (display del error 409 se completa en C3) |
| **Dependencias** | ninguna nueva (Spring Boot 3.2.4 ya provee `MethodArgumentNotValidException`) |
| **API** | respuesta de duplicado de email cambia 500→409 con cuerpo JSON uniforme; respuesta de validation cambia 500→400 con detalles por campo |

## División del cambio (regla >3 archivos)

Este cambio toca ~5 archivos de backend. Se consideró dividirlo en "409 email duplicado" y "400 validation", pero ambas dependen de extender el mismo `GlobalExceptionHandler` y la excepción `UserAlreadyExistsException` es la base del 409; separarlos dejaría el handler incompleto. Decisión: un solo cambio con 3 tareas verificables.

## Rollback Plan

- Revertir el commit restaura el comportamiento anterior (email duplicado → `IllegalArgumentException` → 500; validation → 500). No hay esquema que revertir: solo código Java + extensión del handler existente.
