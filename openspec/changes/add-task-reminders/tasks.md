# Tasks

> Skills: `tdd` en cada tarea funcional; `domain-modeling` al fijar el campo de dominio; `frontend-design` en el indicador.

## 1. Backend — modelo y migracion (TDD)

- [ ] 1.1 (red) Test de integracion que falle: crear/actualizar tarea con `reminderAt` lo refleja y `null` lo limpia; `reminderAt` malformado -> 400 con `errors.reminderAt`; verificar `mvn -Dtest=ErrorContractIntegrationTest test` (rojo). Skills: `tdd`.
- [ ] 1.2 Agregar `reminderAt`/`reminderNotifiedAt` a `Task`, campos a `TaskRequest`/`TaskResponse`, y migracion `V5__add_task_reminders.sql`; verificar `mvn -Dtest=ErrorContractIntegrationTest test` (verde). Skills: `tdd`, `domain-modeling`.

## 2. Backend — ReminderService y endpoints (TDD)

- [ ] 2.1 (red) `ReminderServiceTest` que falle: `dueReminders` excluye futuros/notificados; `acknowledge` es idempotente y respeta ownership; verificar `mvn -Dtest=ReminderServiceTest test` (rojo). Skills: `tdd`.
- [ ] 2.2 Implementar `ReminderService`, el query en `TaskRepository` y los endpoints `GET /v1/tasks/reminders` + `POST /v1/tasks/{id}/reminder-ack`; verificar `mvn -Dtest=ReminderServiceTest test` (verde). Skills: `tdd`.
- [ ] 2.3 Test de integracion de endpoints (due list vacio/lleno, ack, 403/404); verificar `mvn -Dtest=ReminderApiIntegrationTest test`.

## 3. Frontend (TDD)

- [ ] 3.1 (red) `reminders.test.ts` que falle: muestra una `Notification` por recordatorio due y hace ack; sin permiso no lanza; verificar `npx vitest run src/__tests__/reminders.test.ts` (rojo). Skills: `tdd`.
- [ ] 3.2 Implementar `frontend/src/services/reminders.ts` (poller + Notification) y montarlo en `TodoListPage`; verificar `npx vitest run src/__tests__/reminders.test.ts` (verde). Skills: `tdd`.
- [ ] 3.3 Agregar el campo `reminderAt` al `AddTaskModal` y el mapeo en `TaskInput`; verificar `npx vitest run src/__tests__/AddTaskModal.test.tsx`. Skills: `tdd`, `frontend-design`.

## 4. Verificacion

- [ ] 4.1 `mvn test`, `npm test -- --run`, `npm run build`; confirmar verde (depende de 1–3).
