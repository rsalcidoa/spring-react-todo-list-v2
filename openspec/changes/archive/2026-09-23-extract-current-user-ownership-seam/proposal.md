# Proposal: Extract current-user + ownership seam

## Why

El acceso a tareas y tags ajenas al usuario se re-valida hoy en 5 call sites con el patrón `findById` + `filter(user.equals)` (`com.example.todo.service.TaskService:58,84,107,116` y `com.example.todo.controller.TagController.deleteTag:77`), y `com.example.todo.model.User` no define `equals`/`hashCode`: la comparación es por referencia y solo funciona cuando ambas entidades provienen del mismo persistence context (funciona "por suerte"). Consecuencia medible: el acceso a un recurso ajeno devuelve **404 Not Found**, cuando las specs vigentes exigen **403 Forbidden** (`user-authentication` → Task Access Control; `tagging` → Delete User Tag y Tag Ownership Enforcement). Además, la resolución del usuario autenticado está duplicada (`TaskController.getCurrentUser():134-149` y `TagController.getCurrentUser():84-99`), cada copia ejecuta un `userRepository.findByEmail(email)` extra por request, y el comportamiento no es testeable a nivel unitario sin contexto HTTP completo.

## What Changes

- **Nueva seam `com.example.todo.security.CurrentUserProvider`** — resuelve SecurityContext → entidad `User` una vez por request (`current()`, `requireCurrent()`). Reemplaza las dos copias de `getCurrentUser()`.
- **`User.equals`/`hashCode` por `id`** (null-safe) en `com.example.todo.model.User`.
- **Operación de ownership de 3 estados**: carga con `findById` + comparación por `id` → `found` / `not-found` (404) / `forbidden` (403). Una sola query DB por acceso; inmune a usuarios detached.
- **`TaskService`** — `getTaskById`, `createTask`, `updateTask`, `deleteTask`, `patchStatus` dejan de recibir parámetro `User`; resuelven al usuario dentro de la seam.
- **`TagController.deleteTag`** — usa la seam: 403 si el tag es ajeno, 404 si no existe.
- **Nuevo módulo `com.example.todo.exception`** — `OwnershipDeniedException` (403), `ResourceNotFoundException` (404), `UnauthenticatedException` (401) + `GlobalExceptionHandler` (`@RestControllerAdvice`) que los mapea. Adaptador mínimo: `establish-api-error-contract` (C5) lo extenderá con 409/400.
- **Tests** — unit (JUnit5 + Mockito, ya presentes en `spring-boot-starter-test`) a través de la interfaz de `TaskService`/`CurrentUserProvider`, e integration (`@SpringBootTest` + MockMvc, patrón de `TaskCrudIntegrationTest`) con 2 usuarios cubriendo la matriz 403/404/401/2xx.
- **BREAKING (a spec)**: el acceso cruzado a `/v1/tasks/{id}` (GET/PUT/DELETE/PATCH `status`) y DELETE `/v1/tags/{id}` devuelve **403** en vez de 404. Los cuerpos de respuesta en éxito son idénticos.

## Non-goals

- No se añade el adaptador de errores 409/400 (duplicado email, validation) → `establish-api-error-contract` (C5).
- No se añaden `@Valid`/`@NotBlank` a `StatusUpdateRequest`, `RegisterRequest`, `LoginRequest` → `enforce-backend-request-validation` (C4).
- No se toca el formato de due-date (G6) ni la resolución de tags (G7) → `make-tag-resolution-transactional` (C3).
- No hay cambios de frontend (C1/C6), ni de estructura JSON de respuestas, ni del JWT filter. **Excepción mínima en `SecurityConfig`**: se añade un `authenticationEntryPoint` que escribe 401 para requests sin token (spec user-authentication REQ-UAC-001); sin él, Spring Security devolvería 403 por defecto antes de llegar al service. No toca el JWT filter ni la resolución de usuarios; ver design.md (D3).
- No hay migraciones de base de datos: el cambio es solo código (sin columnas ni esquema nuevo).

## Capabilities

### Modified Capabilities

- **user-authentication**: `Task Access Control` — el acceso cruzado (view/update/delete) devuelve 403 y el recurso inexistente devuelve 404; `Task Ownership` — el usuario se resuelve en el service a través de la seam (los Affected files dejan de señalar `TaskRepository.findByUserAndId()`).
- **tagging**: `Delete User Tag` — cross-user 403 y tag inexistente 404 quedan explícitos; `Tag Ownership Enforcement` — la verificación de ownership se centraliza en la seam.

### New Capabilities

- (ninguna)

## Impact

| Capa | Módulos afectados |
|------|-------------------|
| **Backend Java** | `com.example.todo.model.User` (equals/hashCode), `com.example.todo.security.CurrentUserProvider` (nuevo), `com.example.todo.service.TaskService`, `com.example.todo.controller.TaskController`, `com.example.todo.controller.TagController`, `com.example.todo.exception.*` (nuevo) |
| **Frontend TS** | ninguno |
| **Dependencias** | ninguna nueva (JUnit5 + Mockito ya vienen en `spring-boot-starter-test`) |
| **API** | estado HTTP de accesos cruzados cambia 404 → 403 (ya exigido por las specs vigentes); el resto de estados y cuerpos inalterado |

## División del cambio (regla >3 archivos)

El cambio toca ~10 archivos. Se consideró dividirlo en dos (resolver vs. ownership), pero la seam es atómica: separar "resolver al usuario" de "decidir found/not-found/forbidden" dejaría un estado intermedio con el bug activo y sin dónde colocar los tests de integración. Decisión: un solo cambio con tareas pequeñas y verificables por separado (documentado como ADR en design.md).

## Rollback Plan

- Revertir el commit restaura el comportamiento anterior (cross-user 404). No hay esquema que revertir: `equals`/`hashCode` de `User` y las clases nuevas son solo código.
- `GlobalExceptionHandler` mapea únicamente las 3 excepciones nuevas; al rollback se elimina junto con ellas sin tocar otros handlers (no existe handler previo en el proyecto).
