# Tasks

> Skills: `tdd` en cada tarea funcional; `codebase-design` al centralizar el filtro de borrado.

## 1. Backend — soft delete y restore (TDD)

- [x] 1.1 (red) `TaskServiceTest` que falle: `deleteTask` setea `deletedAt` (clock inyectable), `restoreTask` lo limpia, restore idempotente; verificar `mvn -Dtest=TaskServiceTest test` (rojo). Skills: `tdd`.
- [x] 1.2 Agregar `deletedAt` a `Task`, setear/limpiar en el service, y migracion `V10`; verificar `mvn -Dtest=TaskServiceTest test` (verde). Skills: `tdd`.
- [x] 1.3 Filtrar `deletedAt is null` en todas las consultas (repositorio + Specification de `add-task-query`); endpoint `POST /v1/tasks/{id}/restore`; integracion: borrado oculto, restore visible, 403/404; verificar `mvn -Dtest=TaskRecoveryIntegrationTest test`.

## 2. Frontend (TDD)

- [x] 2.1 (red) `TaskRepository.test.ts` que falle: `restore(id)` en ambos adaptadores; verificar `npx vitest run src/__tests__/TaskRepository.test.ts` (rojo). Skills: `tdd`.
- [x] 2.2 Implementar `restore` en `TaskRepository` y `ApiService`; verificar `npx vitest run src/__tests__/TaskRepository.test.ts` (verde). Skills: `tdd`.
- [x] 2.3 (red) `TodoListPage.test.tsx` que falle: tras borrar aparece "Deshacer", al activar re-inserta la tarea, y al expirar se queda borrada; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx` (rojo). Skills: `tdd`.
- [x] 2.4 Implementar la barra de deshacer (reutilizando el patron de auto-ocultado de ErrorBanner); verificar `npx vitest run src/__tests__/TodoListPage.test.tsx` (verde). Skills: `tdd`, `frontend-design`.

## 3. Verificacion

- [x] 3.1 `mvn test`, `npm test -- --run`, `npm run build`; confirmar verde (depende de 1–2).
