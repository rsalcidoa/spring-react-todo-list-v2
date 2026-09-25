# Design

## Context

Estado actual (motivación en proposal.md — Why):

- `TodoListPage.tsx` (~:4) — importa funciones de ApiService directamente (`getTasks`, `patchStatus`, `updateTask`, `createTask`, `deleteTask`, `getTags`); las llama en handlers inline (líneas 51-82) con try-catch disperso.
- `handleDelete` (líneas 76-82) — **muerta**: definida, nunca pasada a ningún componente.
- `loadTags` (línea 25) — SOLO en `useEffect` inicial; al crear/editar una task con tags nuevos, `existingTags` en `AddTaskModal` queda stale.
- `KanbanCard.tsx` — sin botón de delete (solo `onClick` para editar).
- `KanbanColumn.tsx` — pasa `onCardClick`/`onDrop` a KanbanCard.
- `ApiService.ts` — instancia compartida (`api`) con interceptores de auth + 401; exporta todas las funciones CRUD + tags.
- Patrón de test: vitest + RTL + happy-dom; `vi.mock('../services/ApiService')`.

## Goals / Non-Goals

**Goals:**

- Nuevo módulo `TaskRepository` que centraliza operaciones de datos (fetch, create, update, delete, patchStatus, tags).
- Botón de delete en `KanbanCard` wired a `handleDelete` de `TodoListPage`.
- Refresh de tags tras create/update exitosos.

**Non-Goals:**

- No hay cambios de backend.
- No hay tests e2e Playwright.
- No se refactoriza el contexto de auth (ya está en `AuthContext`).
- No se crea un provider/context para el repository (inyección directa en `TodoListPage` es suficiente).

## Diagrama de componentes (después)

```mermaid
flowchart LR
    subgraph FE[Frontend]
        direction TB
        TLP[TodoListPage] -->|inject| THR[TaskRepository]
        TLP --> KC[KanbanColumn]
        KC --> KCard[KanbanCard + delete button]
        TLP --> ATM[AddTaskModal + existingTags]
        THR -->|delegates| AS[ApiService (imported)]
        AS --> api[axios instance /v1]
    end
```

## Decisions

### D1 — `TaskRepository` como clase/instancia sobre ApiService

- Interface `TaskRepository`: `fetchAll()`, `create(task)`, `update(id, task)`, `delete(id)`, `patchStatus(id, status)`, `listTags()`.
- Implementación `HttpTaskRepository`: delega en las funciones de ApiService (`getTasks`, `createTask`, etc.).
- Inyección en `TodoListPage`: `const repository = new HttpTaskRepository();` (sin context/provider).
- `listTags()`: retorna `Promise<Tag[]>` (puro, sin side-effect). El componente llama `repository.listTags()` + `setTags(data)` en su `loadTags()`. Decisión: separar la lectura (repository) del estado (componente) es más puro y menos acoplado; el refresh tras create/update se logra llamando `loadTags()` desde `handleSave`.
- Alternativas:
  - (a) `useReducer`/`useSWR` — descartado: cambia de patrón de estado (fuera de alcance de C6).
  - (b) Inyectar como prop en todo el tree — descartado: el repository solo se usa en `TodoListPage`; propagarlo como prop añade boilerplate innecesario.

### D2 — Botón delete en `KanbanCard` (prop `onDelete`)

- Añadir `onDelete?: () => void` a `KanbanCardProps`; renderizar un botón/icono de delete en `cardHeader`.
- `KanbanColumn` pasa `onDelete={task => () => onDelete?.()}` (curry para capturar el id).
- `TodoListPage` pasa `onDelete={() => handleDelete(t.id)}` a `KanbanColumn`.
- Alternativas:
  - (a) Botón delete en `KanbanColumn` (no en card) — descartado: el delete es por task individual (semántica de card).
  - (b) Hover para mostrar el botón — descartado: reduce la affordance (el usuario debe saber que hace hover para ver el delete).

### D3 — Refresh de tags tras create/update

- En `handleSave`: tras `createTask` o `updateTask` exitoso, llamar `loadTags()` (que a su vez llama `repository.listTags()` + `setTags(data)`).
- El state `tags` de `TodoListPage` se actualiza y `AddTaskModal` re-renderiza con las nuevas tags.
- El `AddTaskModal` recibe `existingTags={tags}` (ya está wired; el refresh actualiza el state y el componente re-renderiza con las nuevas tags).
- Alternativas:
  - (a) Reload completo de la página — descartado: UX ruim (el usuario pierde su posición en el board).
  - (b) Solo refrescar tags si el request incluyó `tagNames` — descartado: la simplificación vale el overhead de `getTags()` (~200ms).

### D4 — Patrón de test para el repository

- Unit del repository: `vi.mock('../services/ApiService')` con mocks de `api.get`, `api.post`, `api.delete`; verificar que los methods del repository delegan correctamente.
- Extend `TodoListPage.test.tsx` con flujo de delete: render page + click delete button → `window.confirm` → `repository.delete()` → verificar que la task desaparece del list.
- Alternativas:
  - (a) Integration test con `msw` — descartado: fuera de alcance (unit tests bastan).
  - (b) Mock del repository en `TodoListPage.test.tsx` — descartado: mejor probar la implementación real (HttpTaskRepository) para cubrir el path completo.

## Estrategia de tests por capa

- **Unit (vitest + RTL + happy-dom)**:
  - `TaskRepository.test.ts` — mock de ApiService; `fetchAll()` → `getTasks()` → returns tasks; `create()` → `createTask()` → returns task; `delete()` → `deleteTask()` → returns void; `refreshTags()` → `getTags()` → returns tags.
  - `KanbanCard.test.tsx` — mock de `onDelete`; verificar que el botón de delete existe y llama `onDelete()` al click.
- **Integration (vitest + RTL)**:
  - Extender `TodoListPage.test.tsx` con flujo de delete: render page con task → click delete button → `window.confirm` → `repository.delete()` → verificar que la task desaparece.
  - Extender con flujo de tags refresh: crear task con nueva tag → verificar que `refreshTags()` fue llamado y las tags se actualizaron.
- **e2e (Playwright)**: ninguno.

## Risks / Trade-offs

- [El repository introduce una capa de indirección adicional en el frontend] → aceptado: la spec del proyecto exige una seam clara para testabilidad; `HttpTaskRepository` es trivial (delega en ApiService).
- [El botón delete en KanbanCard añade un elemento visual adicional] → aceptado: la spec de `frontend-integration` → "Delete Task Functionality" exige un botón de delete visible; el diseño actual solo tiene `onClick` (editar).
- [`refreshTags()` muta el state del component] → aceptado: es un side-effect interno del repository; la alternativa (retornar los tags) requeriría cambiar `handleSave` para recibir el callback; `refreshTags()` es más simple.

## Migration Plan

- Deploy: commit único, sin backend; `npm run build` en frontend.
- Rollback: revert del commit restaura los imports directos de ApiService.
- Orden en el portfolio: este cambio va sexto (C6); depende de C3 (`unify-frontend-http-client`) para que `AuthService` use la instancia compartida.

## Open Questions

- (ninguno)
