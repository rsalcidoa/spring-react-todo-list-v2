# Tasks

> Skills: `tdd` en cada tarea funcional (red-green-refactor); `codebase-design` al fijar el seam `TaskQuery`.

## 1. Backend — query seam (TDD)

- [ ] 1.1 (red) Escribir `TaskQueryTest` que falle: parseo valido, direccion por defecto (`createdAt`->desc, resto->asc), y `sort`/`dir`/`priority` invalidos lanzan el fallo tipado; verificar `mvn -Dtest=TaskQueryTest test` (rojo). Skills: `tdd`.
- [ ] 1.2 Crear `com.example.todo.dto.TaskQuery` (record) + enums `TaskSortField`/`SortDirection` y el `parse(...)` que valida; mapear el fallo tipado a 400 estructurado en `GlobalExceptionHandler`; verificar `mvn -Dtest=TaskQueryTest test` (verde). Skills: `tdd`, `codebase-design`.

## 2. Backend — repository y servicio (TDD)

- [ ] 2.1 (red) Escribir `TaskQueryIntegrationTest` (MockMvc) que falle: `?q=`, `?priority=&tagIds=`, `?sort=dueDate&dir=asc` (con nulls last) y valores invalidos -> 400 exacto; verificar `mvn -Dtest=TaskQueryIntegrationTest test` (rojo). Skills: `tdd`.
- [ ] 2.2 Extender `TaskRepository` con `JpaSpecificationExecutor` y un metodo de busqueda por `TaskQuery`; implementar `TaskService.getAllTasks(TaskQuery)`; adelgazar `TaskController.getAllTasks` para delegar los params crudos; verificar `mvn -Dtest=TaskQueryIntegrationTest test` (verde). Skills: `tdd`.
- [ ] 2.3 Verificar que no hay regresion del filtro `status` existente; `mvn -Dtest=TaskCrudIntegrationTest,ErrorContractIntegrationTest test`.

## 3. Frontend — repositorio y API (TDD)

- [ ] 3.1 (red) Escribir/extender `TaskRepository.test.ts` que falle: `fetchAll({q,priority,sort,dir})` filtra/ordena en `InMemoryTaskRepository` y `HttpTaskRepository` codifica los query params; agregar `TaskQuery` a `services/types/task.ts`; verificar `npx vitest run src/__tests__/TaskRepository.test.ts` (rojo). Skills: `tdd`.
- [ ] 3.2 Implementar `fetchAll(query?)` en ambos adaptadores y `getTasks(query?)` en `ApiService`; verificar `npx vitest run src/__tests__/TaskRepository.test.ts` (verde). Skills: `tdd`.

## 4. Frontend — controles del tablero (TDD)

- [ ] 4.1 (red) Extender `TodoListPage.test.tsx` que falle: la busqueda (con debounce) re-consulta, el control de orden y el filtro de prioridad actualizan la query; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx` (rojo). Skills: `tdd`.
- [ ] 4.2 Implementar caja de busqueda con debounce, control de orden (campo+direccion) y filtro de prioridad en `TodoListPage` con estado de query; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx` (verde). Skills: `tdd`, `frontend-design`.

## 5. E2E y verificación

- [ ] 5.1 (red) Extender `e2e/full-flow.spec.ts` (o un spec nuevo) con busqueda+limpiar; con el stack levantado verificar `npx playwright test e2e` (rojo/verde).
- [ ] 5.2 Correr todo con Postgres arriba: `mvn test`, `npm test -- --run`, `npm run build`; confirmar verde (depende de 1–4).
