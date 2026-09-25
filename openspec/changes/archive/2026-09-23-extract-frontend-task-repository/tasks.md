# Tasks

## 1. Nuevo módulo TaskRepository

- [x] 1.1 Crear `frontend/src/data/TaskRepository.ts`: interface `TaskRepository` con methods `fetchAll()`, `create(task)`, `update(id, task)`, `delete(id)`, `patchStatus(id, status)`, `listTags()`; implementación `HttpTaskRepository` que delega en funciones de ApiService (`getTasks`, `createTask`, `updateTask`, `deleteTask`, `patchStatus`, `getTags`). Verificar con `cd frontend && npx vitest run && npm run build`.

## 2. TodoListPage: delegar al repository

- [x] 2.1 Reemplazar en `frontend/src/pages/TodoListPage.tsx`: importar `HttpTaskRepository` de `../data/TaskRepository`; crear instancia `const repository = new HttpTaskRepository()`; reemplazar llamadas directas a ApiService (`getTasks`, `patchStatus`, etc.) por métodos del repository (`repository.fetchAll()`, `repository.patchStatus()`, etc.); eliminar imports directos de ApiService (excepto `Task`/`Tag` types); agregar `refreshTags()` en `handleSave` tras `createTask` o `updateTask` exitoso. Depende de 1.1. Verificar con `cd frontend && npx vitest run && npm run build`.

## 3. Botón de delete en KanbanCard + KanbanColumn

- [x] 3.1 Añadir `onDelete?: () => void` a `KanbanCardProps` en `frontend/src/components/KanbanCard.tsx`; renderizar un botón de delete en `cardHeader` (icono de basura o "✕") que llame `onDelete?.()`. Depende de 2.1. Verificar con `cd frontend && npx vitest run && npm run build`.
- [x] 3.2 Añadir `onDelete?: (task: Task) => void` a `KanbanColumnProps` en `frontend/src/components/KanbanColumn.tsx`; pasar `onDelete={() => onDelete?.(t)}` a cada `KanbanCard`. Wire en `TodoListPage`: pasar `onDelete={(task) => () => handleDelete(task.id)}` a `KanbanColumn`. Depende de 3.1 y 2.1. Verificar con `cd frontend && npx vitest run && npm run build`.

## 4. Tests unitarios

- [x] 4.1 Crear `frontend/src/__tests__/TaskRepository.test.ts` (vitest, patrón `vi.mock('../services/ApiService')`): mock `getTasks` → `[task1, task2]`; `createTask` → `{ data: task3 }`; `deleteTask` → `{}`; `getTags` → `[tag1, tag2]`; verificar que cada method del repository delega correctamente. Depende de 1.1. Verificar con `cd frontend && npx vitest run TaskRepository` (frontend/).
- [x] 4.2 Extender `TodoListPage.test.tsx` con flujo de delete: render page con 1 task → click delete button → `window.confirm` returns true → `repository.delete(id)` → verificar que la task desaparece del list. Depende de 2.1, 3.2. Verificar con `cd frontend && npx vitest run TodoListPage` (frontend/).

## 5. Gate frontend completo

- [x] 5.1 Gate frontend (todos los tests + build). Depende de 4.1, 4.2. Verificar con `cd frontend && npx vitest run && npm run build`.
