# Proposal — Enforce tag identity at DB level

## Why

La identidad de tag (trim + case-insensitive por usuario, REQ-TAG-001) hoy solo existe en Java (`TagService.exists` / `byKey`). El constraint DB `uq_user_tag (user_id, name)` es case-sensitive en PostgreSQL, así que una carrera `Work` vs `work` inserta dos filas sin violación: duplicado silencioso que contradice la spec. Además, si se agotan los reintentos de `TaskService`, el `IllegalStateException` escala a 500, violando el "nunca 500" de REQ-TAG-001/002.

## What Changes

- Nueva migración Flyway `V4__tag_identity_ci.sql`: normaliza (`btrim`), fusiona duplicados preexistentes por `(user_id, lower(name))` re-apuntando `task_tags`, elimina `uq_user_tag` y crea índice único funcional `uq_user_tag_ci ON tags (user_id, lower(name))`.
- `model/Tag.java`: elimina `uniqueConstraints` del `@Table` (no puede expresar un índice funcional; queda comentario apuntando a V4).
- `service/TaskService.java` (`createTask`/`updateTask`): al agotar reintentos lanza `TagAlreadyExistsException` (409) en vez de `IllegalStateException` (500).
- Sin cambios en `TagService`: con el índice, la carrera case-variante ya eleva `DataIntegrityViolationException` y los paths existentes la mapean (`create` → 409, flujo task → retry + reuse).

## Capabilities

### New Capabilities

(Ninguna.)

### Modified Capabilities

- `tagging`: REQ-TAG-001/005 — identidad ahora enforced en DB vía índice funcional (+ escenario case-variante bajo carrera); REQ-TAG-002 — contención persistente → 409, nunca 500.

## Impact

- Módulos: `com.example.todo.model.Tag`, `com.example.todo.service.TaskService`, `db/migration/V4__tag_identity_ci.sql`.
- APIs: sin cambios de forma; `POST /v1/tags` case-duplicado bajo carrera ahora garantiza 409; `POST/PUT /v1/tasks` bajo contención persistente garantiza 409 en vez de 500.
- Datos: la migración fusiona tags duplicados preexistentes (keeper = `MIN(id)`, asociaciones re-apuntadas). Es el comportamiento que REQ-TAG-001 exige; documentado como intencional.
- Dependencia: ningún otro cambio depende de este en código, pero el cambio B (`tag-validation-and-status-query`) corre después para no editar `TaskService.java` en paralelo.

## Non-goals

- Validación de elementos de `tagNames` (cambio B).
- `GET /v1/tasks?status=INVALID` estructurado (cambio B).
- Eliminar el overload muerto `TaskService.patchStatus` (higiene futura, fuera de alcance).
- Columna `citext` o columna normalizada persistida (descartadas en design.md).

## Rollback plan

- Revert del commit + migración compensatoria `V5` (dropear `uq_user_tag_ci`, restaurar `UNIQUE (user_id, name)`) solo si se revierte tras aplicar en una DB migrada. Flyway no auto-revierte. La fusión de duplicados no es reversible fila a fila (aceptado: los duplicados violaban la spec).
