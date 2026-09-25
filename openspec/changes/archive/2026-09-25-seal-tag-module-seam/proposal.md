# Proposal — Seal the tag module seam

## Why

`TagService.resolve()` devuelve la entidad JPA `Tag` mientras `list`/`create` devuelven `TagResponse`: la seam fuga persistencia hacia `TaskService.assignTags`, y ningún test puede verificar identidad sin PostgreSQL real (los tests de índice escapan por `JdbcTemplate`). Además el retry vive en el caller (`TaskService` + `TransactionTemplate`), no en el módulo que posee la identidad.

## What Changes

- `TagService.resolve()` mueve el retry dentro del módulo (create-or-reuse con reintento ante `DataIntegrityViolationException`, mapeando a reuse/409 igual que `create`) y deja de devolver la entidad: retorna `TagResponse`/value sin `user` ni lazy-proxies.
- `TaskService.assignTags` se adapta a la nueva firma (resuelve ids/dtOs y asocia sin tocar la entidad `Tag`).
- `TagRepository` gana lookup case-insensitive (`findByUserIdAndNameIgnoreCase`-style o query `lower()`) para que `exists`/`resolve` no carguen la lista completa en memoria.
- Sin cambios de API HTTP ni de comportamiento observable: mismos códigos, mismos shapes.

## Capabilities

### New Capabilities

(Ninguna.)

### Modified Capabilities

- `tagging`: REQ-TAG-001/002/003 — el módulo Tag posee retry y no expone la entidad (nota de interface, sin cambio de escenarios HTTP).

## Impact

- Módulos: `com.example.todo.service.TagService`, `com.example.todo.repository.TagRepository`, `com.example.todo.service.TaskService` (solo `assignTags`), `com.example.todo.model.Tag` si el retorno exige value object, tests `TagServiceTest`, `TagResolutionIntegrationTest`, `TagIdentityMigrationTest`.
- APIs: sin cambios observables. Riesgo: `TaskService` es tocado también por el cambio D — orden: B antes que D.
- Nota de split: una sola seam (Tag); las tasks van por capas (repository → service → callers).

## Non-goals

- Cambiar el índice funcional V4 o la migración (ya archivada).
- Módulo board frontend (cambio A), User/reset (cambio C), retry de Task/dedupe de `patchStatus` (cambio D).
- Segundo adapter de persistencia (la seam Java↔DB sigue hipotética; documentado, no se introduce fake solo por simetría).

## Rollback plan

Revert del commit. Sin migraciones; rollback seguro. Si se revierte tras aplicar D, re-aplicar D encima (D toca `assignTags`/`TaskService` ajeno a este cambio salvo firma).
