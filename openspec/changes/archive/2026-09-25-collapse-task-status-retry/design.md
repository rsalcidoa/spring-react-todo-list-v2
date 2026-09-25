# Design — Collapse task retry, prune dead status operation

## Context

Ver `proposal.md` (Why). Estado (tras B): `TaskService.createTask/updateTask` con bucles de retry idénticos; `patchStatus(Long, TaskStatus)` muerto; `parseStatus` privado ejercitado por entrada. Cambio puramente interno.

## Goals / Non-Goals

**Goals:** un helper de retry, una sola operación de status, tests sin duplicar superficies.
**Non-Goals:** política de retry, contrato 409, seams nuevas.

## Decisions

1. **Helper privado `withTagRetry(Supplier<TaskResponse>)`** (vs clase aparte). Dos call sites en el mismo módulo: un método privado basta; extraer clase sería seam hipotética.
2. **Borrar `patchStatus`** (vs deprecar). Código interno sin callers: el deletion test ya dio "no pierde depth". Búsqueda de usos antes de borrar.
3. **Colapsar tests duplicados** (vs mantener ambos). Los casos own/foreign/missing de `patchStatus` se pliegan a `applyStatus`; el conteo total de tests baja pero la cobertura de la `interface` real sube.

## Risks / Trade-offs

- [B no aplicado aún] → D espera a B (mismo fichero). Orden documentado en proposal.
- Ningún riesgo observable: refactor interno con suite verde como red.

## Migration Plan

Sin migraciones. Rollback: revert. Aplicar después de B.

## Test strategy

- `TaskServiceTest`: helper cubierto vía create/update existentes + agotamiento→409; casos `patchStatus` plegados a `applyStatus`.
- Gates: `docker compose up -d && cd backend && mvn test`.
