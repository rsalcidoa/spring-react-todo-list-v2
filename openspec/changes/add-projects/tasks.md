# Tasks

> Skills: `tdd` en cada tarea funcional; `domain-modeling` al fijar `Project`.

## 1. Backend — modulo de proyectos (TDD)

- [x] 1.1 (red) `ProjectServiceTest` que falle: nombre CI duplicado -> 409, trim, ownership; verificar `mvn -Dtest=ProjectServiceTest test` (rojo). Skills: `tdd`.
- [x] 1.2 Crear `Project`, `ProjectRepository`, `ProjectService`, DTOs y migracion `V7`; verificar `mvn -Dtest=ProjectServiceTest test` (verde). Skills: `tdd`, `domain-modeling`.
- [x] 1.3 `ProjectApiIntegrationTest`: CRUD, 409, 403, 404 y listado solo id/name ordenado; verificar `mvn -Dtest=ProjectApiIntegrationTest test`.

## 2. Backend — asignacion en tareas (TDD)

- [x] 2.1 (red) Test que falle: crear/actualizar con `projectId` propio lo refleja, `null` lo limpia, `projectId` ajeno -> 400 `errors.projectId`; borrar proyecto desasigna tareas; verificar `mvn -Dtest=TaskCrudIntegrationTest test` (rojo). Skills: `tdd`.
- [x] 2.2 Agregar `project` a `Task` + DTOs, resolver/validar el proyecto en `TaskService`; verificar `mvn -Dtest=TaskCrudIntegrationTest test` (verde). Skills: `tdd`.

## 3. Frontend (TDD)

- [x] 3.1 (red) `TaskRepository.test.ts` que falle: `listProjects/createProject/renameProject/deleteProject` en ambos adaptadores; verificar `npx vitest run src/__tests__/TaskRepository.test.ts` (rojo). Skills: `tdd`.
- [x] 3.2 Implementar las operaciones de proyecto en `TaskRepository` y `ApiService`; verificar `npx vitest run src/__tests__/TaskRepository.test.ts` (verde). Skills: `tdd`.
- [x] 3.3 Selector de proyecto en `AddTaskModal` + filtro por proyecto en el header; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx src/__tests__/AddTaskModal.test.tsx`. Skills: `tdd`, `frontend-design`.

## 4. Verificacion

- [x] 4.1 `mvn test`, `npm test -- --run`, `npm run build`; confirmar verde (depende de 1–3).
