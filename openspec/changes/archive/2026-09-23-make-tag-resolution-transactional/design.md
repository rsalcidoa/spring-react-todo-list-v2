# Design

## Context

Estado actual (motivación en proposal.md — Why):

- `TaskService.resolveTag()` (líneas 47-54) — `tagRepository.findByNameAndUser(name, user)` → lookup exacto por nombre; si null → `new Tag(name, user)` + `tagRepository.save(tag)`. Sin trim, sin case-insensitive, sin transacción.
- `TagRepository` — `findByNameAndUser(String name, User user)` (exact match); `findAllByUser(User user)`.
- `Tag` — unique constraint `user_id + name` en PostgreSQL. Sin índices adicionales.
- `TaskService.createTask()` y `updateTask()` llaman `resolveTag()` en un bucle `for (String name : tagNames)`.
- Stack: Java 21, Spring Boot 3.2.4, PostgreSQL + Flyway. Patrón de test integration: `TaskCrudIntegrationTest` (`@SpringBootTest` + `@AutoConfigureMockMvc`).

## Goals / Non-Goals

**Goals:**

- Normalización de nombres: `trim()` + case-insensitive (lowercase para comparación).
- Atomicidad: `TransactionTemplate` con máx 2 intentos; concurrentes crean 1 tag.
- Batch lookup: `findByUserId(Long)` + map en memoria keyed por trimmed-lowercase.

**Non-Goals:**

- No se cambian los endpoints CRUD de tags.
- No hay migración de esquema.
- No hay cambios de frontend.

## Diagrama de secuencia (resolveTag con transacción)

```mermaid
sequenceDiagram
    participant S as TaskService
    participant TT as TransactionTemplate
    participant TM as TransactionManager
    participant R as TagRepository
    participant DB as PostgreSQL

    S->>TT: execute(status -> {
    TT->>TM: beginTransaction
    TM-->>TT: status
    TT->>R: findByUserId(userId)
    R->>DB: SELECT * FROM tags WHERE user_id = ?
    DB-->>R: List<Tag>
    R-->>TT: allTags
    TT->>S: build normalized map
    alt tag encontrado
        S-->>TT: return existing tag
    else tag no encontrado
        S->>R: save new Tag(trimmedName, user)
        R->>DB: INSERT INTO tags
        alt unique constraint violation
            R-->>DB: DataIntegrityViolationException
            DB-->>R: exception
            R-->>TT: exception
            TT->>TM: rollback
            TM-->>TT: status reset
            alt retry < maxRetries
                TT->>R: findByUserId (reload)
                R-->>TT: existing tag (created by other tx)
                TT-->>S: return reused tag
            else max retries exhausted
                TT->>TM: rollback
                TT-->>S: re-throw exception
            end
        else insert success
            R-->>TT: Tag
            TT-->>S: return new tag
        end
    end
    })
```

## Decisions

### D1 — `TransactionTemplate` con `PlatformTransactionManager` + retry

- Inyectar `PlatformTransactionManager` en `TaskService`; crear `TransactionTemplate` con `PROPAGATION_REQUIRED` + `ISOLATION_READ_COMMITTED` + máx 2 intentos.
- En el primer intento: batch lookup → map → create si no existe. Si `DataIntegrityViolationException` → retry (re-load tags + re-save task).
- Alternativas:
  - (a) `@Transactional` en `createTask()` — descartado: `@Transactional` no proporciona retry automático (la exception no es RuntimeException, se necesita try-catch + retry manual de todos modos).
  - (b) `LockModeType.OPTIMISTIC` — descartado: no cubre la carrera de INSERT (la unique constraint se verifica al final); el lock solo protege SELECT.
  - (c) `LockModeType.PESSIMISTIC_WRITE` sobre la tabla de tags — descartado: serializa toda la tabla (hotspot), mal rendimiento.

### D2 — Batch lookup en memoria + map trimmed-lowercase

- `tagRepository.findByUserId(userId)` → `List<Tag>`; construir `Map<String, Tag>` keyed por `name.trim().toLowerCase()`.
- Para la búsqueda: `key = name.trim().toLowerCase()`. Si existe → retornar el tag existente (con su nombre canónico original). Si no → crear `new Tag(name.trim(), user)`.
- Alternativas:
  - (a) `findByNameLowercaseAndUser` con función DB `LOWER(name)` — descartado: requiere índice `LOWER(name)` + migración de esquema; el map en memoria es trivial para el cardinal esperado (<100 tags por usuario).
  - (b) Guardar el nombre en lowercase y normalizarlo en `getName()` — descartado: pérdida del nombre original (los usuarios quieren ver "Work", no "work"); el tag existente conserva su nombre canónico.

### D3 — Retry solo en `DataIntegrityViolationException`

- Catch `DataIntegrityViolationException` en el INSERT → re-load `findByUserId()` → si el tag ya existe (creado por la otra transacción concurrente) → reusarlo y commit. Si no existe → re-throw (es otro error, no una carrera).
- Máx 2 intentos (el primer intento + 1 retry cubre la mayoría de los casos de carrera; 2 es suficiente para la carga esperada).
- Alternativas:
  - (a) Sin retry, solo pre-check — descartado: race condition inevitable bajo concurrencia.
  - (b) Retry con backoff exponencial — descartado: innecesario para transacciones de <10ms.

### D4 — `findByUserId(Long)` en TagRepository

- Método derivado de Spring Data: `List<Tag> findByUserId(Long userId)`. No requiere migración de índice (la FK `user_id` ya está indexada por la relación JPA).
- Alternativas:
  - (a) `findAllByUser(User)` → filtrar en Java — descartado: el parámetro del service es `userId` (Long), no `User`; convertir User → id es overhead.

## Estrategia de tests por capa

- **Unit (JUnit5 + Mockito, sin contexto Spring)**:
  - `TaskServiceTest` (extendido de C1): mock de `TagRepository` y `TransactionTemplate`; `resolveTag()` con tag existente (trimmed-lowercase match) → retorna existente; `resolveTag()` con tag nuevo → crea; `resolveTag()` con `DataIntegrityViolationException` → retry → reuse.
- **Integration (`@SpringBootTest` + MockMvc, patrón `TaskCrudIntegrationTest`)**:
  - `TagResolutionIntegrationTest` — usuario registrado; 3 sub-tests:
    1. POST `/v1/tasks` con `tagNames: [" Work "]` (espacios) + tag `Work` existente → 201, 1 tag (sin duplicado), tag name = "Work".
    2. POST `/v1/tasks` con `tagNames: ["NewTag"]` (2 requests secuenciales rápidos) → ambos 201, 1 row en DB.
    3. PUT `/v1/tasks/{id}` con `tagNames: ["work"]` (lowercase) + tag `Work` existente → 200, tag name = "Work" (canónico).
- **e2e (Playwright)**: ninguno.

## Risks / Trade-offs

- [Retry en `DataIntegrityViolationException` introduce una segunda query DB en el caso de carrera] → aceptado: la carrera es rara; el overhead de la segunda query (SELECT + map) es <5ms.
- [El batch lookup carga todos los tags del usuario en memoria] → aceptado: <100 tags por usuario (UI dropdown), ~1KB de objetos; no hay memoria problemática.
- [El nombre trimmed se guarda, pero no se normaliza en los endpoints CRUD de tags] → aceptado: el POST de tag no hace trim; si un usuario crea "Work " manualmente, persiste con espacios. Esto no afecta la resolución de tasks (que hace trim). Si se desea, C4 puede añadir trim en el endpoint de tags como follow-up.

## Migration Plan

- Deploy: commit único, sin migraciones; `mvn package` normal.
- Rollback: revert del commit restaura `resolveTag` original. `findByUserId` se elimina (es un método derivado de Spring Data sin migración).
- Orden en el portfolio: este cambio va cuarto (C3); depende de C1 (ownership seam) y C5 (no depende del handler 409 de C5).

## Open Questions

- (ninguno)
