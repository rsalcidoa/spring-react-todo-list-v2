# Tasks

> Skills: `tdd` en cada tarea funcional; `domain-modeling` al fijar la relacion `parent/children`.

## 1. Backend — modelo y servicio (TDD)

- [x] 1.1 (red) `SubtaskServiceTest` que falle: regla de un nivel (`parentId` a un subtask -> 400), padre ajeno -> 400, progreso `done/total`; verificar `mvn -Dtest=SubtaskServiceTest test` (rojo). Skills: `tdd`.
- [x] 1.2 Crear `SubtaskService`, `parent` en `Task`, campos DTO y migracion `V8` (`ON DELETE CASCADE`); verificar `mvn -Dtest=SubtaskServiceTest test` (verde). Skills: `tdd`, `domain-modeling`.
- [x] 1.3 Endpoints `GET /v1/tasks/{id}/subtasks` y exclusion de subtasks del board; verificar `mvn -Dtest=SubtaskApiIntegrationTest test`.

## 2. Backend — cascada y progreso (TDD)

- [x] 2.1 (red) Test que falle: borrar padre elimina hijos; borrar hijo conserva al padre; progreso refleja hijos; verificar `mvn -Dtest=SubtaskApiIntegrationTest test` (rojo). Skills: `tdd`.
- [x] 2.2 Implementar cascada (DB + JPA) y `subtaskProgress` en la respuesta; verificar `mvn -Dtest=SubtaskApiIntegrationTest test` (verde). Skills: `tdd`.

## 3. Frontend (TDD)

- [x] 3.1 (red) `TaskRepository.test.ts` que falle: `listSubtasks/createSubtask/deleteSubtask` en ambos adaptadores; verificar `npx vitest run src/__tests__/TaskRepository.test.ts` (rojo). Skills: `tdd`.
- [x] 3.2 Implementar las operaciones de subtasks en `TaskRepository` y `ApiService`; verificar `npx vitest run src/__tests__/TaskRepository.test.ts` (verde). Skills: `tdd`.
- [x] 3.3 Seccion de subtasks en `AddTaskModal` y `done/total` en `KanbanCard`; verificar `npx vitest run src/__tests__/AddTaskModal.test.tsx src/__tests__/TodoListPage.test.tsx`. Skills: `tdd`, `frontend-design`.

## 4. Verificacion

- [x] 4.1 `mvn test`, `npm test -- --run`, `npm run build`; confirmar verde (depende de 1–3).
