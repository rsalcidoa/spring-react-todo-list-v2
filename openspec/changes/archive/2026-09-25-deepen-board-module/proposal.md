# Proposal — Deepen the board module

## Why

La `interface` `TaskRepository` promete dominio pero el board vive en sus callers: `TodoListPage` reconcilia tags por id en 3 sitios, parchea estado a mano porque `update()` devuelve `void`, y `AddTaskModal` salta la seam (usa `ApiService.createTag/deleteTag` directo y fabrica `{id: Date.now()}`), rompiendo el matching por `id`. Los tests mockean `ApiService` por debajo de la seam, así que nada de esto está cubierto.

## What Changes

- `TaskRepository` posee operaciones de tags: `listTags` (ya existe) + `createTag(name): Promise<Tag>` (id real del backend) + `deleteTag(id)`.
- `update(id, input)` devuelve el `Task` actualizado; la page deja de parchear `setTasks` a mano.
- Conversión dominio↔wire (`toWire/fromWire`) dentro de `HttpTaskRepository`; `InMemoryTaskRepository` iguala semántica backend (trim+case-insensitive, `move` sobre inexistente rechaza).
- `TodoListPage` conserva solo view state (grouping, drag, confirm); `AddTaskModal` usa el repository (sin import de `ApiService`, sin ids falsos).
- Un solo mapeo de errores del contrato (`409/400/404` → mensajes) compartido por page y modal.

## Capabilities

### New Capabilities

(Ninguna.)

### Modified Capabilities

- `frontend-integration`: REQ-FE-009 (operaciones del repository: +`createTag`/`deleteTag`, `update` devuelve `Task`, semántica por adapter), Tag Creation/Deletion from Modal (vía repository, ids reales), Delete Task Functionality (confirm + rollback vía módulo).

## Impact

- Módulos: `frontend/src/data/TaskRepository.ts`, `frontend/src/pages/TodoListPage.tsx`, `frontend/src/components/AddTaskModal.tsx`, `frontend/src/services/ApiService.ts` (solo firmas si hace falta), `frontend/src/services/types/task.ts`, tests `TaskRepository.test.ts`, `TodoListPage.test.tsx`, `AddTaskModal.test.tsx`.
- Sin cambios de API backend ni de rutas. Comportamiento observable: ids de tag reales desde creación, rollback en `move` fallido, mismo contrato de error en page y modal.
- Nota de split (regla >3 archivos): se mantiene un solo cambio por ser una sola seam; las tasks van en 2 fases (1: seam+adapters, 2: callers) para pasos pequeños y verificables.

## Non-goals

- Módulos backend Tag/Task/User (cambios B, C, D).
- Cambios visuales del board (columnas, estilos, drag UX).
- `DefaultClient`/`ApiClient`: se elimina o se pliega si queda shallow tras el cambio (decisión en design).

## Rollback plan

Revert del commit. Sin migraciones ni cambios de esquema; frontend puro, rollback seguro.
