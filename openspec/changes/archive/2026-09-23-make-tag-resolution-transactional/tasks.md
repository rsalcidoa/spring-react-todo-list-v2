# Tasks

## 1. TagRepository: nuevo método findByUserId

- [x] 1.1 Añadir `List<Tag> findByUserId(Long userId)` a `TagRepository` (método derivado de Spring Data). Verificar con `mvn compile` (backend/).

## 2. TaskService: resolveTag con transacción y normalización

- [x] 2.1 Inyectar `PlatformTransactionManager` en `TaskService` (campo `private final PlatformTransactionManager transactionManager`); crear `TransactionTemplate` con `PROPAGATION_REQUIRED` + máx 2 intentos. Verificar con `mvn compile` (backend/).
- [x] 2.2 Reescribir `resolveTag(User user, String name)`: `TransactionTemplate.execute(status -> { ... })` — batch lookup `findByUserId(user.getId())` → map `keyed by name.trim().toLowerCase()`; si encontrado → retornar; si no → `new Tag(name.trim(), user)` + `tagRepository.save(tag)` envuelto en try-catch `DataIntegrityViolationException` → retry (re-load + re-save); retornar tag existente en retry. Verificar con `mvn compile` (backend/).
- [x] 2.3 Actualizar `createTask()` y `updateTask()`: las llamadas a `resolveTag()` permanecen igual (solo cambia la implementación interna). Verificar con `mvn compile` (backend/).

## 3. Unit tests

- [x] 3.1 Extender `TaskServiceTest` con casos de `resolveTag`: mock de `TransactionTemplate`; `findByUserId` retorna tag existente → `resolveTag(" Work ")` retorna el existente (trimmed-lowercase match); `findByUserId` retorna vacío → `resolveTag("NewTag")` crea tag con nombre trimmed; `tagRepository.save()` lanza `DataIntegrityViolationException` → retry → `findByUserId` retorna tag (creado por otra transacción) → retorna existente. Depende de 2.2. Verificar con `mvn test -Dtest=TaskServiceTest` (backend/).

## 4. Integration tests

- [x] 4.1 Crear `TagResolutionIntegrationTest` (`@SpringBootTest` + `@AutoConfigureMockMvc`, patrón `TaskCrudIntegrationTest`):
    - (a) Registrado + tag "Work" creado via POST `/v1/tags`; POST `/v1/tasks` con `tagNames: [" Work "]` → 201, 1 tag en response, tag name = "Work" (sin duplicado).
    - (b) POST `/v1/tasks` con `tagNames: ["NewTag"]` (2 requests secuenciales) → ambos 201, verificar que solo existe 1 tag "NewTag" en DB.
    - (c) PUT `/v1/tasks/{id}` con `tagNames: ["work"]` (lowercase) + tag "Work" existente → 200, tag name = "Work" (canónico).
    Depende de 3.1. Verificar con `mvn test -Dtest=TagResolutionIntegrationTest` (backend/).

## 5. Gate backend completo

- [x] 5.1 Gate backend (todos los tests). Depende de 4.1. Verificar con `mvn test` (backend/).
- [x] 5.2 Gate frontend de regresión (sin cambios esperados). Depende de 5.1. Verificar con `cd frontend && npx vitest run && npm run build`.
