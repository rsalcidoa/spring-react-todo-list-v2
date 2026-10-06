# Tasks

> Skills: `tdd` en cada tarea funcional.

## 1. Backend — envelope y validacion (TDD)

- [ ] 1.1 (red) Test que falle: `?page=0&size=2` devuelve envelope con `total`; sin params devuelve array; `size=0`/`page=-1` -> 400 `errors.page|size`; verificar `mvn -Dtest=TaskPaginationIntegrationTest test` (rojo). Skills: `tdd`.
- [ ] 1.2 Implementar `PageResponse`, `Pageable` en el service y el branch del controller (depende de `add-task-query` para el Specification); verificar `mvn -Dtest=TaskPaginationIntegrationTest test` (verde). Skills: `tdd`.
- [ ] 1.3 Integracion: paginacion compuesta con `q`/`sort`; verificar `mvn -Dtest=TaskPaginationIntegrationTest test`.

## 2. Frontend (TDD)

- [ ] 2.1 (red) `TaskRepository.test.ts` que falle: `fetchPage(query,page,size)` en ambos adaptadores (page/total correctos); verificar `npx vitest run src/__tests__/TaskRepository.test.ts` (rojo). Skills: `tdd`.
- [ ] 2.2 Implementar `fetchPage` en `TaskRepository` y `getTasks(query,page,size)` en `ApiService`; verificar `npx vitest run src/__tests__/TaskRepository.test.ts` (verde). Skills: `tdd`.
- [ ] 2.3 (red) `TodoListPage.test.tsx` que falle: "Cargar más" anexa la pagina siguiente y cambiar la query resetea a page 0; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx` (rojo). Skills: `tdd`.
- [ ] 2.4 Implementar el estado de pagina y "Cargar más" en `TodoListPage`; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx` (verde). Skills: `tdd`, `frontend-design`.

## 3. Verificacion

- [ ] 3.1 `mvn test`, `npm test -- --run`, `npm run build`; confirmar verde (depende de 1–2).
