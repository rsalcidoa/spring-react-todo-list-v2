# Proposal: Deepen tag module, status operation, and board seam

## Why

La revisión de arquitectura (`ARCHITECTURE-REVIEW-PLAN.md`, 2026-09-23) comparó las main specs contra la implementación y confirmó 3 oportunidades de deepening con evidencia en el código:

- **A — Módulo Tag (Strong)**: la identidad de tag en scope del usuario (trim, case-insensitive, unique por usuario) vive implementada dos veces: `TaskService.resolveTag` (normalizado, race-safe) vs `TagController.createTag` (match exacto, sin trim, sin manejo de carrera). Consecuencias medibles: `POST /v1/tags` con `"name": "work"` y `Work` existente crea un **duplicado silencioso** (la unique constraint de PostgreSQL es case-sensitive); la carrera lanza `DataIntegrityViolationException` sin handler → **500** (la spec exige 409); y `GET /v1/tags` devuelve la entidad `Tag`, cuyo getter `user` serializa el **hash BCrypt de la contraseña** + email al navegador (fuga de seguridad). Es además el follow-up que el `design.md` de `make-tag-resolution-transactional` dejó explícitamente abierto y ningún cambio recogió.
- **B — Status (Worth exploring)**: el cambio de status entra al módulo Task por dos seams (PUT completo y PATCH de solo status). `TaskController.patchStatus` hace `TaskStatus.valueOf` manual → enum inválido → **400 con body vacío**; `REQ-STATUS-004` exige field-level details `{"error":"Validation failed","errors":{…}}`. La garantía "only one status value may be stored per request" no vive en ningún sitio.
- **C — Board seam (Worth exploring)**: `HttpTaskRepository` es shallow (6 métodos ≈ 6 passthroughs; deletion test: borrarlo no cambia la complejidad, que vive en `TodoListPage`). La seam domain↔wire miente: la interface dice `create(Omit<Task,'id'>)` (dominio con `tags: Tag[]`) pero el wire necesita `tagNames: string[]`; la conversión está escondida tras `as any` en 4 sitios, y un caller que pase un `Task` de dominio real crea la task **sin tags en silencio** (el backend ignora el campo desconocido). Solo existe 1 adapter → la seam es hipotética.

Se abordan los tres en este cambio porque el request lo pide explícitamente y porque A es fix de bug + fuga de seguridad que no admite esperar a un siguiente portfolio.

## What Changes

- **A — Módulo Tag profundo (backend)**: nuevo `TagService` detrás de una interface pequeña — `list(user)`, `create(user, name)`, `delete(user, id)`, `resolve(user, names) → tags` — que posee: normalización (trim + case-insensitive) en todos los entry points, batch lookup (UNA `findByUserId` + map en memoria, manteniendo el retry de C3), uniqueness con race → **409** (nunca 500), y el shape de respuesta (`TagResponse {id, name}` en la seam). `TagController` queda delegate delgado (como `TaskController`). `TaskService.createTask`/`updateTask` delegan `resolve` y corren en **una** transacción (si falla el save de la task, no quedan tags huérfanos). `TagRepository` se reduce a lo que el módulo necesita.
- **B — Una sola operación de status (backend)**: `TaskService.applyStatus(id, rawStatus)` a la que deleguen **ambos** endpoints HTTP (PUT y PATCH; ambos se mantienen, la spec exige los dos). El failure tipado (valor inválido) se mapea por `GlobalExceptionHandler` al 400 estructurado con field-level details; el controller pierde el `valueOf` manual y queda puramente HTTP.
- **C — Board seam real (frontend)**: la interface `TaskRepository` se profundiza a operaciones de board con tipos de dominio: `fetchAll()`, `create(input: TaskInput)`, `update(id, input: TaskInput)`, `move(id, status)`, `remove(id)`, `listTags()`. `HttpTaskRepository` posee la conversión domain↔wire (`tags` ↔ `tagNames`). Nuevo **adapter in-memory** (`InMemoryTaskRepository`) → dos adapters = seam real; los tests ejercen conversión y operaciones a través de la interface, sin mocks. `any`/`as any` desaparecen de `TodoListPage`, `AddTaskModal` y `ApiService.updateTask`.
- **BREAKING (intencional)**: `GET /v1/tags` y `POST /v1/tags` responden solo `{id, name}` por tag. Hoy `GET /v1/tags` serializa la entidad `Tag` completa, incluyendo `user.password` (hash BCrypt) y `user.email`. El único consumer conocido (`HttpTaskRepository.listTags`) ya trataba la respuesta como `{id, name}`.
- **Conformidad con spec existente**: 400 de status inválido (PUT y PATCH) y de nombre de tag inválido pasan de body vacío a field-level details `{"error":"Validation failed","errors":{"<field>":[msg]}}` — es lo que la spec ya exige (`REQ-STATUS-004`), no una nueva ruptura.

## Non-goals

- **No** el paso 2 opcional de la revisión (módulo `useTasks` con estado optimista + rollback): la page conserva el view state optimista actual; queda diferido.
- **No** hay migración de esquema: la unique constraint `(user_id, name)` ya existe; no se añaden índices.
- **No** se eliminan endpoints: PUT y PATCH de status se mantienen (la spec exige ambos); `delete`/`patchStatus` se renombran a `remove`/`move` solo en la interface frontend.
- **No** hay cambios de UI ni de autenticación (specs `user-authentication` y `backend-validation` no tocan nada).
- **No** se normaliza el case del tag persistido: el primer input fija el nombre canónico (misma regla de C3); solo se trimean los espacios.

## Capabilities

### New Capabilities

- (ninguna — los tres candidatos modifican capacidades existentes)

### Modified Capabilities

- **tagging**: identidad de tag normalizada en el CRUD (trim + case-insensitive en `POST /v1/tags`), duplicado case-insensitive → 409, carrera → 409 (no 500), shape de respuesta `{id, name}` en `GET/POST /v1/tags` (la entidad no cruza la seam HTTP), y atomicidad create/update de task con sus tags. Requirements modificados: `Tag Entity Uniqueness Per User`, `Tag Assignment on Task Create`, `Tag Assignment on Task Update`, `List User Tags`, `Create User Tag`.
- **task-status**: una sola operación de status (`applyStatus`) detrás de la interface del módulo Task; 400 con field-level details para status inválido tanto en PUT como en PATCH. Requirements modificados: `Task Status Field` (scenario invalid value), `Task Update Includes Status`, `PATCH Status Update Endpoint`.
- **frontend-integration**: ADDED `Board Task Repository Operations` (REQ-FE-009) — operaciones de board tipadas, conversión domain↔wire propiedad de los adapters, adapter in-memory, sin `any` en la seam; MODIFIED `Delete Task Functionality` (nombrado `remove`/`move` de la interface).

## Impact

| Capa | Módulos afectados |
|------|-------------------|
| **Backend Java** | `com.example.todo.service.TagService` (nuevo); `com.example.todo.controller.TagController` (delegate delgado); `com.example.todo.service.TaskService` (delega `resolve`/`applyStatus`; una transacción); `com.example.todo.repository.TagRepository` (superficie reducida); `com.example.todo.dto.TagRequest` (nuevo) + `TagResponse` (reutilizado); `com.example.todo.exception.GlobalExceptionHandler` (+ mapping del failure de status); `com.example.todo.controller.TaskController` (sin `valueOf`) |
| **Frontend TS** | `frontend/src/data/TaskRepository.ts` (interface profunda + `HttpTaskRepository` + `InMemoryTaskRepository`); `frontend/src/services/types/task.ts` (`TaskInput`); `frontend/src/services/ApiService.ts` (`updateTask` tipado); `frontend/src/pages/TodoListPage.tsx`; `frontend/src/components/AddTaskModal.tsx` |
| **Tests** | Backend: `TagServiceTest` (nuevo), `TagApiIntegrationTest` (nuevo), extender `TaskCrudIntegrationTest`/`ErrorContractIntegrationTest`; Frontend: `TaskRepository.test.ts` (reescrito sobre la interface), `TodoListPage.test.tsx` (actualizar), `AddTaskModal.test.tsx` (nuevo, pendiente de C6) |
| **API** | `GET/POST /v1/tags` → `{id, name}` (**BREAKING**); 400 de status/nombre inválido con field-level details (PUT, PATCH, POST tags); resto de la API invariante |
| **Dependencias** | ninguna nueva |

## División del cambio (regla >3 archivos)

El cambio toca >3 archivos (~8 backend + ~5 frontend + tests), por lo que la regla del portfolio propone dividir. La división natural en 3 cambios (A, B, C) es posible — no hay dependencias cruzadas entre candidatos — pero el request pide explícitamente **un solo cambio que abarque todas las áreas de oportunidad**. Decisión: un solo cambio con **tres bloques independientes** (A, B, C), cada uno con su propio commit, su propio gate de verificación (`mvn test` / `npx vitest run`) y rollback por candidato. Cada tarea de `tasks.md` termina en verde antes de continuar.

## Rollback Plan

- **A**: revert del commit restaura `TagController`/`TaskService` previos; se elimina `TagService` y `TagRequest`. Sin esquema que revertir (no hay migración). El shape BREAKING de `/v1/tags` vuelve con el revert.
- **B**: revert del commit restaura `patchStatus` con `valueOf` en el controller; se elimina el exception de status y su mapping.
- **C**: revert del commit restaura la interface de 6 passthroughs; se elimina `InMemoryTaskRepository` y `TaskInput`.
- Sin datos que limpiar: la normalización trimea nombres nuevos al crearlos; los tags ya existentes conservan su nombre canónico (misma regla de C3, sin data migration).
