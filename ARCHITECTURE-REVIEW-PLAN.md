# Architecture Review Plan — TO-DO-Test (estado actual del código)

Fecha: 2026-09-23. Generado por la revisión de arquitectura (`improve-codebase-architecture`),
informado por `openspec/specs/*` y `openspec/changes/archive/*` (los 6 cambios del portfolio
están implementados y archivados). Vocabulario de arquitectura: **module, interface, depth,
seam, adapter, leverage, locality** (`codebase-design`). Sin `CONTEXT.md` ni `docs/adr/` en el
proyecto: crear `CONTEXT.md` perezosamente al fijar el nombre del módulo profundizado.

## Conclusion

Los 6 cambios del portfolio están implementados y verificados:

| Cambio | Verificado en |
|---|---|
| C1 `extract-current-user-ownership-seam` | `CurrentUserProvider` (requireCurrent/requireOwned), TaskController/TagController delegan |
| C2 `establish-api-error-contract` | `GlobalExceptionHandler` (401/403/404/409/400), `TaskCrudIntegrationTest` |
| C3 `make-tag-resolution-transactional` | `TaskService.resolveTag` (TransactionTemplate, retry, trim + case-insensitive) |
| C4 `enforce-backend-request-validation` | `@Valid`/`@NotBlank` en RegisterRequest, LoginRequest, TaskRequest, StatusUpdateRequest |
| C5 `unify-frontend-http-client` | `ApiService` instancia compartida + interceptores (auth/401), `AuthService` sin cliente propio |
| C6 `extract-frontend-task-repository` | `TaskRepository` interface + `HttpTaskRepository`, botón de delete wired, tag refresh |

Comparando las main specs contra la implementación quedan **3 oportunidades de deepening**
aplicables. La primera es además un fix de bug + fuga de seguridad, y el propio `design.md`
de C3 la nombró como follow-up pendiente que ningún cambio posterior recogió.

| # | Candidato | Recomendación |
|---|-----------|---------------|
| **A** | Módulo **Tag** profundo — el dominio de tag vive repartido en dos implementaciones | **Strong** |
| **B** | Una sola operación de **status** detrás de la interface del módulo Task | Worth exploring |
| **C** | Frontend: la seam del repository es hipotética — profundizarla a operaciones de board | Worth exploring |

---

## Candidato A — Módulo Tag profundo (identidad de tag implementada dos veces; la entidad se fuga en la seam)

**Recomendación: Strong (Top recommendation).**

### Files

- `backend/src/main/java/com/example/todo/controller/TagController.java`
- `backend/src/main/java/com/example/todo/service/TaskService.java` (`resolveTag`, líneas 59-93)
- `backend/src/main/java/com/example/todo/repository/TagRepository.java`
- `backend/src/main/java/com/example/todo/model/Tag.java`, `dto/TagResponse.java`
- Tests: `TagResolutionIntegrationTest`, `OwnershipApiIntegrationTest`; nuevos `TagServiceTest` / test de API de tags

### Spec anchors

`openspec/specs/tagging/spec.md`: Tag Entity Uniqueness Per User, REQ-TAG-002/003
(normalización trim + case-insensitive), List User Tags, Create User Tag, REQ-DUT-001,
REQ-TOE-001, Task Tag Response Format ("consistent across all endpoints").

### Problem

1. **Dos implementaciones de un mismo concepto de dominio** — "identidad de tag en scope del
   usuario" (trim, case-insensitive, unique por usuario) — detrás de dos seams:
   `TaskService.resolveTag` (normalizado, race-safe con retry) vs `TagController.createTag`
   (match exacto, sin trim, sin manejo de carrera). El unique constraint `(user_id, name)` de
   PostgreSQL es **case-sensitive**: `POST /v1/tags {"name":"work"}` con `Work` existente crea
   un **tag duplicado silencioso**; la carrera en `POST /v1/tags` lanza
   `DataIntegrityViolationException` sin handler → **500** (la spec exige 409/422). Es
   literalmente el follow-up que el `design.md` de C3 dejó abierto: *"el POST de tag no hace
   trim … Si se desea, C4 puede añadir trim en el endpoint de tags como follow-up"* — C4 se
   fue a `@Valid`/`@NotBlank` y el follow-up nunca llegó.
2. **Módulo controller shallow**: `TagController` guarda acceso al repository y reglas de
   negocio (su interface es casi tan compleja como su implementación — contrastar
   `TaskController`, que delega a `TaskService`).
3. **Fuga en la interface**: `GET /v1/tags` devuelve la entidad `Tag`, cuyo getter `user`
   serializa el **hash BCrypt de la contraseña** + email al cliente; y su shape es
   inconsistente con `TagResponse {id, name}` usado dentro de los task objects.
4. **N+1 + sin atomicidad**: `createTask`/`updateTask` iteran por nombre → una `findByUserId`
   (lectura completa) por tag name, cada una en su propia transacción (el design de C3 preveía
   un solo batch lookup en una transacción); si falla el save de la task, los tags resueltos
   quedan commiteados huérfanos.

### Solution

- Un módulo Tag profundo (service) detrás de una **interface** pequeña:
  `list(user)`, `create(user, name)`, `delete(user, id)`, `resolve(user, names) → tags`.
  Posee: normalización (trim + key case-insensitive), batch lookup (UNA `findByUserId` + map
  en memoria, manteniendo el retry de C3 para reuse en carrera), uniqueness → 409/422, y el
  shape de respuesta (`TagResponse` en la seam; la entidad nunca cruza la interface HTTP).
- `TagController` queda como delegate delgado (como `TaskController`); `TaskService` delega
  `resolve` y create/update de task corre en **una** transacción (el retry re-ejecuta la
  operación completa, no solo el tag).
- La superficie de `TagRepository` se reduce detrás del módulo (eliminar la duplicación
  `findByNameAndUser`/`findAllByUser`/`findByUserId`; quedarse con lo que el módulo necesite).

### Benefits

- **Locality**: todos los bugs de identidad de tag (normalización, duplicados, carrera,
  shape, fuga del hash) se concentran en un módulo; el follow-up pendiente del design de C3
  aterriza aquí — no tuvo módulo al que ir.
- **Leverage**: tanto el path HTTP de tags como el path de tasks cruzan la misma interface;
  un fix de normalización paga en todos los callers.
- **Testabilidad**: la **interface es la superficie de test** — normalización, reuse en
  carrera, 409/403/404 y el shape de respuesta son verificables sin MockMvc; la fuga del hash
  se caza con una aserción sobre el shape de la respuesta.
- **Deletion test**: borrar las dos implementaciones ad-hoc esparce las reglas de identidad
  entre los dos call sites; el módulo profundo las concentra → "sí, concentra".

### Before / After

- **Before**: `TagController → TagRepository` (reglas en el controller) **y**
  `TaskService → resolveTag → TagRepository` (reglas duplicadas); entidad `Tag` a la salida
  HTTP (con `user.password`).
- **After**: ambos callers → interface del módulo Tag → repository; `TagResponse` en la seam;
  create/update de task en una transacción.

### Spec deltas

`tagging` (MODIFIED Uniqueness/Create: identidad normalizada, 409 en duplicado
case-insensitive, carrera → 409; response format). Sin conflicto con ADR (no existen ADRs);
completa el follow-up que el design de C3 dejó explícitamente abierto.

---

## Candidato B — Una sola operación de status detrás de la interface del módulo Task

**Recomendación: Worth exploring.**

### Files

- `backend/src/main/java/com/example/todo/controller/TaskController.java` (`patchStatus`, `updateTask`)
- `backend/src/main/java/com/example/todo/service/TaskService.java`
- `backend/src/main/java/com/example/todo/dto/StatusUpdateRequest.java`
- `backend/src/main/java/com/example/todo/exception/GlobalExceptionHandler.java`
- Tests: extender `ErrorContractIntegrationTest` / `ApiIntegrationTests`

### Spec anchors

`openspec/specs/task-status/spec.md`: Task Update Includes Status, REQ-STATUS-004
(PATCH invalid status value rejected → 400 con field-level details).

### Problem

- El cambio de status llega al módulo Task por **dos seams**: PUT de update completo y PATCH
  de solo status. `TaskController.patchStatus` hace `TaskStatus.valueOf` manual (regla de
  negocio dentro del módulo controller) → enum inválido → **400 con body vacío**; el
  scenario de la spec exige field-level details `{"error":"Validation failed","errors":{…}}`
  — el path `@Valid` produce ese shape, el path enum lo evita.
- Intra-módulo hay dos paths que setean status (`updateTask` vs `patchStatus`); la garantía
  de la spec ("only one status value may be stored per request", transición atómica) no vive
  en ningún sitio.

### Solution

- Una operación `applyStatus(id, status)` dentro del módulo Task a la que deleguen ambos
  endpoints; status tipado a enum en la **interface** con failure tipado mapeado por el
  `GlobalExceptionHandler` existente al 400 estructurado (field-level details).
  Controllers puramente HTTP. **Mantener ambos endpoints HTTP** (la spec exige ambos): esto
  profundiza la operación, no elimina un endpoint.

### Benefits

- **Una sola superficie de test** para el comportamiento de status (transición válida,
  valor único atómico, shape del valor inválido) verificada una vez.
- **Locality** de los bugs de status y de cualquier regla de transición futura.
- **Deletion test**: el método `patchStatus` del controller es pass-through salvo el
  `valueOf` — borrarlo solo mueve la coerción.

### Spec deltas

`task-status` (MODIFIED: shape 400 para status inválido vía la operación, no vía el controller).

---

## Candidato C — Frontend: la seam del repository es hipotética (profundizarla a operaciones de board)

**Recomendación: Worth exploring.**

### Files

- `frontend/src/data/TaskRepository.ts`
- `frontend/src/pages/TodoListPage.tsx`
- `frontend/src/services/ApiService.ts`
- `frontend/src/components/AddTaskModal.tsx`
- `frontend/src/services/types/task.ts`
- Tests: `TaskRepository.test.ts`, `TodoListPage.test.tsx`, nuevo `AddTaskModal.test.tsx`
  (está en el plan de tests del design de C6 y nunca se escribió)

### Spec anchors

`openspec/specs/frontend-integration/spec.md`: Delete Task Functionality,
Tag List Refresh (REQ-FE-008), API Integration.

### Problem

1. `HttpTaskRepository` es **shallow**: 6 métodos de interface ≈ 6 passthroughs.
   **Deletion test**: borrar el módulo → la complejidad desaparece (la page llamaría a
   `ApiService` directamente). La complejidad real vive en `TodoListPage`: status optimista
   sin rollback, grouping, confirm de delete, tag refresh, drag & drop.
2. **La seam domain↔wire miente**: la interface dice `create(Omit<Task,'id'>)` (el tipo de
   dominio tiene `tags: Tag[]`) pero el wire necesita `tagNames: string[]`. La conversión
   está escondida tras `as any` en 4 sitios (`HttpTaskRepository.create`,
   `TodoListPage.handleSave` ×2, `ApiService.updateTask(id, task: any)`,
   `AddTaskModal` `onSave: (data: any)`). Trampa: un caller que pase un `Task` de dominio
   real (con `tags`) crea la task **sin tags** en silencio (el backend ignora el campo
   desconocido `tags`).
3. **Un adapter = seam hipotética**: solo existe `HttpTaskRepository` (el adapter in-memory
   del plan de handoff nunca materializó); los tests mockean `ApiService` y asercion
   delegación, lo cual cementa la shallowness (el design de C6 eligió exactamente ese
   patrón de test).

### Solution

- Profundizar la interface a operaciones de board con tipos de dominio:
  `fetchAll()`, `create(input: TaskInput)`, `update(id, input: TaskInput)`,
  `move(id, status)`, `remove(id)`, `listTags()`. `HttpTaskRepository` posee la conversión
  domain→wire (`tags`↔`tagNames`) y wire→domain; `ApiService.updateTask` y
  `AddTaskModal.onSave` reciben inputs tipados (desaparece el `any`).
- Añadir el **adapter in-memory** → dos adapters = seam real; los tests ejercen la
  conversión y el `move` optimista a través de la interface, sin mocks.
- Paso 2 opcional (C5 de la revisión anterior): módulo `useTasks` de board que posee el
  estado optimista con rollback; la page conserva solo view state.

### Benefits

- **Locality** de los bugs de board (tags stale, rollback optimista, confirm de delete).
- **Leverage**: page y modal comparten una interface tipada; el `as any` desaparece (la
  trampa de "tags en silencio" se elimina por tipado).
- **Testabilidad**: con el adapter in-memory la seam es real; conversión y paths
  optimistas testables a través de la interface.

### Spec deltas

`frontend-integration` (ADDED: TaskRepository operations / board seam). Sin conflicto con ADR.

---

## Top recommendation

**Candidato A — el módulo Tag profundo.** Es el único candidato que además es fix de bug y
fuga de seguridad: la duplicación case-sensitive contradice la propia identidad
case-insensitive de la spec (REQ-TAG-002), la carrera devuelve 500 donde la spec dice 409,
y `GET /v1/tags` hoy envía el hash de la contraseña del usuario al navegador. B y C compran
depth y testabilidad; A compran correctness y seguridad encima. Y es el improvement que los
mismos docs de OpenSpec nombran como pendiente (el follow-up de trim del design de C3).

## Checked and not flagged (YAGNI)

- Auth register→auto-login dos llamados, mensajes de `LoginRequest` (el bundle de Spring
  Boot resuelve defaults), anotaciones de `TaskRequest`/`StatusUpdateRequest`, ownership
  seam, 409 en duplicate email, due date solo-fecha, wiring del botón de delete, tag
  refresh — todo conforme a spec como está implementado.
- Higiene (no arquitectura): dir `~/` suelto, `.vite/` en la raíz, HTMLs de revisión
  anteriores en la raíz, shim de re-export de 3 líneas `frontend/src/__tests__/pages/LoginPage.tsx`.

## Execution steps (una vez aprobado el plan)

1. **Grilling** del candidato elegido (`grilling` skill): constraints, forma del módulo
   profundizado, qué queda detrás de la seam, qué tests sobreviven.
2. **Side effects** a medida que se cristalicen decisiones (`domain-modeling`):
   - `CONTEXT.md` no existe → crearlo con el nombre de dominio del módulo profundizado
     (p. ej. "Tag identity" / módulo de tag del usuario).
   - Si un candidato se rechaza con razón load-bearing → ofrecer ADR.
3. **Implementación** vía OpenSpec (`openspec propose`): delta de spec + design + tasks,
   convención del portfolio (body español, headings inglés, IDs `REQ-<CAP>-###`,
   tasks por capa unit/integration/e2e con checks por layer).
4. **Verification gates**: `cd backend && docker compose up -d && mvn test`;
   `cd frontend && npx vitest run && npm run build` (Playwright solo si se cambia UI;
   hoy no).
5. **Archivar** el cambio con `openspec archive` al completar.
