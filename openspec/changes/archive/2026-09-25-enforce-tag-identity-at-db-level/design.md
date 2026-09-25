# Design — Enforce tag identity at DB level

## Context

Ver `proposal.md` (Why). Estado actual: `V2__add_status_and_tags.sql` crea `CONSTRAINT uq_user_tag UNIQUE (user_id, name)` (case-sensitive en PG); `Tag.java:7` lo declara vía `@UniqueConstraint`; `TagService.create` (`TagService.java:38-53`) y `resolve` (`TagService.java:61-82`) chequean identidad normalizada solo en Java; `TaskService.createTask/updateTask` (`TaskService.java:60-101`) reintentan ante `DataIntegrityViolationException` y lanzan `IllegalStateException` al agotar (→ 500, `GlobalExceptionHandler` no lo mapea). `ddl-auto=validate`, migraciones en `backend/src/main/resources/db/migration`.

## Goals / Non-Goals

**Goals:** identidad normalizada imposible de violar ni bajo carrera; eliminar el `500` por contención de tags; migración segura con datos preexistentes.
**Non-Goals:** validación de elementos de `tagNames`, query `?status` inválido (cambio B); limpieza del overload `patchStatus` muerto.

## Decisions

1. **Índice único funcional `(user_id, lower(name))` + dedupe en V4** (vs `citext` vs columna `name_key` persistida). `citext` exige extensión PG y cambia semántica de columna; `name_key` duplica la fuente de verdad. El índice funcional es una sola DDL, y el código ya guarda siempre trimmeado (`create`/`resolve` hacen `trim()`), así que `lower(name)` equivale a la identidad normalizada. Orden en V4: `btrim` defensivo → rewire `task_tags` (borrar primero las filas que colisionarían `(task_id, keep_id)`, re-apuntar resto al `MIN(id)`, borrar perdedores) → drop constraint → create index.
2. **Quitar `uniqueConstraints` de `Tag.java`** (vs mantenerlo). No puede expresar un índice funcional y quedaría mentiroso; con `ddl-auto=validate` Hibernate no valida índices, así que quitarlo es seguro (a verificar en implementación con `mvn test`).
3. **Sin cambios en `TagService`**. Con el índice, la carrera case-variante eleva `DataIntegrityViolationException`: `create` ya la mapea a 409 vía recheck `exists()`; en flujo task el retry de `TaskService` re-ejecuta `resolve()` con fetch fresco y reusa al ganador. No se añade lógica, solo el enforcement que faltaba.
4. **Agotamiento → `TagAlreadyExistsException` (409)** (vs mapear `IllegalStateException` en el handler). Con Bean Validation delante y sin otros constraints únicos en `tasks`, la única violación realista es el índice de tags = carrera perdida → 409 es semánticamente correcto y reusa el contrato body-less existente. Mapear `IllegalStateException` en el handler enmascararía bugs genuinos; el throw explícito en `TaskService.java:79,100` es auditable.

## Risks / Trade-offs

- [Datos duplicados preexistentes] → la V4 los fusiona (keeper `MIN(id)`); aceptado como intencional (violaban REQ-TAG-001), documentado en proposal.
- [`validate` protesta por falta del constraint] → mitigación: revertir solo el punto 2 (cosmético, el índice vive en SQL).
- [Concurrent `POST /v1/tags` exact-duplicate ya cubierto; case-variante ahora cubierto por índice] → test secuencial + razonamiento; test de carrera real multihilo queda como best-effort (H2/PG local, flaky por naturaleza).
- [Exhaustion unit-test necesita `PlatformTransactionManager` mockeado inline] → mockear `getTransaction`/`commit` para ejecutar el callback; si se complica, test de integración con `TagService` mockeado lanzando siempre.

## Migration Plan

Deploy: Flyway aplica V4 al arrancar (dev y test). Rollback: revert código + `V5` compensatoria (drop index, restore `UNIQUE (user_id, name)`); fusión de datos no reversible fila a fila. Orden: este cambio (A) antes que B (ambos tocan `TaskService.java`).

## Test strategy

- Migración: la V4 ya corrió sobre la DB de desarrollo (Flyway log); `TagIdentityMigrationTest` fija invariantes post-migración (cero grupos duplicados, cero huérfanos en `task_tags`, cero nombres sin trim) + enforcement del índice (insert crudo case-variante → `DataIntegrityViolationException`, mismo nombre entre usuarios OK). No se testea el merge pre/post con fixture porque requeriría estado pre-V4 ya inexistente.
- API: `POST /v1/tags {"name":"work"}` con `Work` → 409 sin fila; `POST /v1/tasks` con case-variante reusa (201, una fila).
- Unit: exhaustion → 409 (ver Decisions.4).
- Gates: `docker compose up -d && cd backend && mvn test`.
