# Tasks

> Skills: `tdd` en cada tarea funcional; `codebase-design` al fijar el seam de orden.

## 1. Backend — posicion y endpoint (TDD)

- [ ] 1.1 (red) `TaskOrderingServiceTest` que falle: ownership, `parseStatus`, posicion finita, tie-break por `createdAt`; verificar `mvn -Dtest=TaskOrderingServiceTest test` (rojo). Skills: `tdd`.
- [ ] 1.2 Agregar `position` a `Task`/`TaskResponse`, `PositionUpdateRequest`, `TaskOrderingService` y `PATCH /v1/tasks/{id}/position`, migracion `V9`; verificar `mvn -Dtest=TaskOrderingServiceTest test` (verde). Skills: `tdd`.
- [ ] 1.3 Integracion: reorder dentro y entre columnas; posicion/estado invalido -> 400; 403/404; verificar `mvn -Dtest=TaskOrderingApiIntegrationTest test`.

## 2. Frontend (TDD)

- [ ] 2.1 (red) `TaskRepository.test.ts` que falle: `reorder(id,status,position)` en ambos adaptadores; verificar `npx vitest run src/__tests__/TaskRepository.test.ts` (rojo). Skills: `tdd`.
- [ ] 2.2 Implementar `reorder` en `TaskRepository` y `ApiService`; verificar `npx vitest run src/__tests__/TaskRepository.test.ts` (verde). Skills: `tdd`.
- [ ] 2.3 (red) `TodoListPage.test.tsx` que falle: columnas ordenadas por `position`, drop calcula el punto medio y llama `reorder`, rollback ante fallo; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx` (rojo). Skills: `tdd`.
- [ ] 2.4 Implementar el orden por `position` y el reorder por drag en `TodoListPage`/`KanbanColumn`; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx` (verde). Skills: `tdd`, `frontend-design`.

## 3. Verificacion

- [ ] 3.1 `mvn test`, `npm test -- --run`, `npm run build`; confirmar verde (depende de 1–2).
