# Proposal: Make tag resolution transactional

## Why

El método `TaskService.resolveTag()` (líneas 47-54) resuelve o crea tags por nombre exacto (`findByNameAndUser(name, user)`), sin trim ni case-insensitive. Consecuencias medibles:
- " Work " no se resuelve como "Work" (Duplicación de tags innecesaria).
- "work" ≠ "Work" (fragmentación del namespace de tags por case).
- Sin `@Transactional` en la operación de creación → race condition concurrente: dos requests con el mismo tag nuevo causan `DataIntegrityViolationException` → 500 (la unique constraint `user_id + name` no se respeta en la carrera).

Las specs existentes (`tagging` → "Tag Assignment on Task Create" y "Tag Assignment on Task Update") ya exigen resolución/creación automática, pero no especifican trim/case ni atomicidad. C4 añade estos detalles para que las operaciones sean atómicas y normalizadas.

## What Changes

- **`resolveTag` reescrito**: usar `TransactionTemplate` (`PlatformTransactionManager`) + máx 2 intentos con retry; resolución por lote: `tagRepository.findByUserId(user.getId())` → map en memoria keyed por nombre trimmed-lowercased; crear tag solo si no existe; retry = re-cargar tags + re-guardar (la task fue rollback por la transacción).
- **Normalización**: comparar `trim()` + case-insensitive (lowercase); el tag nuevo se guarda trimmed (mantiene el case original del input); el tag existente conserva su nombre canónico.
- **`TagRepository`**: añadir método `List<Tag> findByUserId(Long userId)` (derivado de Spring Data) para el batch lookup.
- **Tests**: `TagResolutionIntegrationTest` — `" Work "` con tag `Work` existente → sin duplicado; 2 POST concurrentes con mismo tag nuevo → ambos 201 + 1 row; PUT `["work"]` → tag existente resuelto.

## Non-goals

- No se cambian los endpoints CRUD de tags (POST/GET/DELETE `/v1/tags`).
- No hay migración de esquema: la unique constraint `user_id + name` ya existe.
- No hay cambios de frontend (la respuesta del backend ya incluye el nombre canónico).
- No se crean tags predefinidos ni importación de tags.

## Capabilities

### Modified Capabilities

- **tagging**: `Tag Assignment on Task Create` — los nombres se normalizan (trim + case-insensitive) antes de la resolución; concurrentes crean 1 tag en vez de fallar; preservar "Create task with existing tags", "Create task with non-existing tags creates them"; añadir "Tag names are trimmed and case-insensitive", "Concurrent creation of the same tag reuses it". `Tag Assignment on Task Update` — lo mismo; preservar "Replace task tags via update"; añadir "Update resolves tag names case-insensitively".

### New Capabilities

- (ninguna)

## Impact

| Capa | Módulos afectados |
|------|-------------------|
| **Backend Java** | `com.example.todo.service.TaskService` (resolveTag reescrito), `com.example.todo.repository.TagRepository` (nuevo `findByUserId`), `com.example.todo.model.Tag` (sin cambios) |
| **Frontend TS** | ninguno |
| **Dependencias** | ninguna nueva (TransactionTemplate es parte de Spring Core) |
| **API** | respuesta de tags en tareas: el nombre es siempre el trimmed (sin espacios leading/trailing); el case es el del tag canónico existente o el del input si es nuevo |

## División del cambio (regla >3 archivos)

Este cambio toca ~3-4 archivos (TaskService, TagRepository, TagResolutionIntegrationTest). Se consideró dividir en (a) normalize trim/case y (b) transaccional, pero ambas partes son inseparables: la normalización sin transaccional no evita la carrera; la transacción sin normalización no soluciona el problema de case/trim. Decisión: un solo cambio con tareas verificables.

## Rollback Plan

- Revertir el commit restaura `resolveTag` original (lookup exacto, sin transacción). No hay esquema que revertir: `findByUserId` es un método derivado de Spring Data sin migración; la única operación de rollback es eliminar el método del repository.
- Orden en el portfolio: este cambio va cuarto (C3); depende de C1 (seam de ownership) y C5 (handler 409 no se usa aquí).
