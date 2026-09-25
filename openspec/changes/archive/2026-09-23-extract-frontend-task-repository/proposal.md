# Proposal: Extract frontend task repository

## Why

`TodoListPage.tsx` importa funciones de ApiService directamente (`getTasks`, `patchStatus`, `updateTask`, `createTask`, `deleteTask`, `getTags`) y las llama dispersas por handlers inline (líneas 51-82). No hay una capa de abstracción intermedia; cada handler replica el patrón try-catch. Además:
- `handleDelete` (líneas 76-82) está **muerta**: definida pero nunca pasada a ningún componente; la spec de `frontend-integration` → "Delete Task Functionality" exige un botón de delete visible.
- `loadTags` (línea 25) se ejecuta SOLO en el `useEffect` inicial; al crear/editar una task con tags nuevos, `existingTags` en `AddTaskModal` queda stale y el usuario no ve los tags recién creados sin hacer reload de página.

C6 extrae un módulo repository que centraliza las operaciones de datos y resuelve ambos problemas.

## What Changes

- **Nuevo módulo `frontend/src/data/TaskRepository.ts`**: interface `TaskRepository` + implementación `HttpTaskRepository` sobre ApiService. Methods: `fetchAll()`, `create(task)`, `update(id, task)`, `delete(id)`, `patchStatus(id, status)`, `listTags()`, `refreshTags()` (fetch + setTags).
- **`TodoListPage.tsx`**: delegar todas las operaciones de datos en el repository; eliminar imports directos de ApiService.
- **Botón de delete en KanbanCard**: extender `KanbanCardProps` con `onDelete?: () => void`; pasar desde `KanbanColumn` → `TodoListPage` → `handleDelete`; `window.confirm` ya existe en handleDelete.
- **Refresh de tags tras create/update**: tras `createTask` o `updateTask` exitosos, llamar `refreshTags()` para actualizar `tags` state y `existingTags` del modal.

## Non-goals

- No hay cambios de backend (el repository solo consume las APIs existentes).
- No hay tests e2e Playwright.
- No se refactorizan los componentes UI (KanbanCard, KanbanColumn, AddTaskModal) beyond lo necesario para el delete button y tags refresh.
- No se crea un provider/context para el repository (la inyección directa en `TodoListPage` es suficiente para el alcance actual).

## Capabilities

### Modified Capabilities

- **frontend-integration**: `Delete Task Functionality` — Affected files → `KanbanCard` (botón delete), `KanbanColumn` (prop `onDelete`), `TodoListPage` (handleDelete wired + repository), `TaskRepository` (delete method); preservar "User Deletes Task".

### New Capabilities

- **frontend-integration**: `Tag List Refresh` (ADDED) — el board refresca las tags disponibles tras create/update que introduce tags nuevos.

## Impact

| Capa | Módulos afectados |
|------|-------------------|
| **Frontend TS** | `frontend/src/data/TaskRepository.ts` (nuevo), `frontend/src/pages/TodoListPage.tsx` (delegar al repo), `frontend/src/components/KanbanCard.tsx` (+botón delete), `frontend/src/components/KanbanColumn.tsx` (+prop onDelete) |
| **Backend Java** | ninguno |
| **Dependencias** | ninguna nueva |
| **API** | sin cambios (el FE solo consume las APIs existentes vía el nuevo repository) |

## División del cambio (regla >3 archivos)

Este cambio toca ~5 archivos frontend. Se consideró dividir en (a) repository y (b) delete button + tags refresh, pero el wiring de handleDelete depende de que `TodoListPage` use el repository (para `delete()`); separarlos dejaría una versión incompleta donde el botón delete no funciona. Decisión: un solo cambio con 4 tareas verificables.

## Rollback Plan

- Revertir el commit restaura los imports directos de ApiService en `TodoListPage`. No hay esquema que revertir: solo TypeScript.
- El botón delete en `KanbanCard` es aditivo; al rollback, `KanbanCard` vuelve a solo `onClick`.
