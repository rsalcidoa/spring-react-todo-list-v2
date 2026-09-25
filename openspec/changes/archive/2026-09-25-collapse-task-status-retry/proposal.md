# Proposal — Collapse task retry, prune dead status operation

## Why

`TaskService.createTask`/`updateTask` duplican el bucle `MAX_ATTEMPTS` + `transactionTemplate.execute` + `catch` con comentario idéntico; el overload `patchStatus(Long, TaskStatus)` es un pass-through muerto junto a `applyStatus(Long, String)` que sí usa el controller; y `parseStatus` (privado) se testea una vez por cada entrada HTTP. Poca fricción aislada, pero es la higiene que deja al módulo Task con una sola operación de escritura por concepto.

## What Changes

- Helper de retry único en `TaskService` usado por `createTask` y `updateTask` (misma política `MAX_ATTEMPTS`, mismo mapeo a `409` del cambio B).
- Eliminar el overload muerto `patchStatus(Long, TaskStatus)`; `applyStatus(Long, String)` queda como única operación de status.
- Sin cambios de API HTTP, códigos ni shapes.

## Capabilities

### New Capabilities

(Ninguna.)

### Modified Capabilities

- `task-status`: REQ-STATUS-002/004 — nota de interface: una sola operación `applyStatus` (sin cambio de escenarios).

## Impact

- Módulos: `com.example.todo.service.TaskService`, tests `TaskServiceTest` (colapsar duplicados own/foreign/missing entre `patchStatus` y `applyStatus`).
- APIs: sin cambios observables. Depende de: `seal-tag-module-seam` (B) aplicado antes — ambos tocan `TaskService.java` (`assignTags`/firma de `resolve` en B, retry en D).
- Cambio pequeño (1 fichero productivo + tests); no requiere split.

## Non-goals

- Cambiar política de reintentos, transaccionalidad o contrato 409 (ya fijados en B).
- Módulos Tag/User/board (cambios A, B, C).

## Rollback plan

Revert del commit. Sin migraciones; rollback seguro. Si se revierte tras B, B no se ve afectado (D solo refactoriza dentro de TaskService).
