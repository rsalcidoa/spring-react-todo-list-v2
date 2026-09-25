# Proposal — Validación de tagNames + `?status` inválido estructurado

## Why

Dos huecos del contrato de errores: `TaskRequest.tagNames` acepta elementos blank/sobredimensionados (crea tags vacíos, inconsistente con REQ-TAG-005 1–50) y `GET /v1/tasks?status=INVALID` falla en el binding de Spring con un body genérico fuera del contrato `400 {"error":"Validation failed","errors":{…}}`.

## What Changes

- `dto/TaskRequest.java`: constraints en elementos de `tagNames` (`@NotBlank` + `@Size(max=50)`); inválidos → `400` field-level bajo clave `tagNames`.
- `exception/GlobalExceptionHandler.java`: colapsar paths `tagNames[i]` a la clave `tagNames` en el `400` de validación.
- `controller/TaskController.java` + `service/TaskService.java`: el filtro `status` se recibe como `String` y lo parsea la operación del módulo (`parseStatus`), así un valor inválido produce el `400` estructurado existente en vez del error genérico de Spring.
- Sin cambios de frontend (`AddTaskModal` ya limita a 50 chars y muestra el `400`).

## Capabilities

### New Capabilities

(Ninguna.)

### Modified Capabilities

- `backend-validation`: REQ-BV-003 — suma reglas de elementos de `tagNames` y shape del `400`.
- `task-status`: Column Filtering — valor inválido → `400` estructurado.
- `task-management`: List All Tasks — escenario `?status=INVALID` → `400`.

## Impact

- Módulos: `com.example.todo.dto.TaskRequest`, `com.example.todo.exception.GlobalExceptionHandler`, `com.example.todo.controller.TaskController`, `com.example.todo.service.TaskService` (overload `getAllTasksByStatus(String)`).
- APIs: `POST/PUT /v1/tasks` con `tagNames` inválidos ahora `400` (antes `201` con tags basura — **BREAKING** intencional, alinea a REQ-TAG-005); `GET /v1/tasks?status=INVALID` ahora `400` estructurado (antes `400` genérico de Spring — cambio de body, no de código).
- Depende de: `enforce-tag-identity-at-db-level` (orden de aplicación; ambos tocan `TaskService.java`, este cambio corre segundo).
- Toca 4 ficheros + 3 specs → se acepta como un solo cambio (validación cohesiva); dividido del cambio A ya según la regla >3 archivos.

## Non-goals

- Migración DB / índice de tags (cambio A).
- Agotamiento→409 (cambio A).
- Eliminar overload muerto `patchStatus`.
- Cambios de frontend.

## Rollback plan

Revert del commit. Sin migraciones ni cambios de esquema; rollback seguro y sin pérdida de datos.
