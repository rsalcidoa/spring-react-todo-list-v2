# Tasks

> Skills: `tdd` en cada tarea funcional; `domain-modeling` al fijar `Recurrence`/`recurrenceSourceId`.

## 1. Backend — regla pura (TDD)

- [x] 1.1 (red) `RecurrenceRuleTest` que falle: DAILY +1d, WEEKLY +7d, MONTHLY con clamp (`2026-01-31 -> 2026-02-28`); verificar `mvn -Dtest=RecurrenceRuleTest test` (rojo). Skills: `tdd`.
- [x] 1.2 Implementar `RecurrenceRule` y el enum `Recurrence`; verificar `mvn -Dtest=RecurrenceRuleTest test` (verde). Skills: `tdd`, `domain-modeling`.

## 2. Backend — campo y migracion (TDD)

- [x] 2.1 (red) Test que falle: `recurrence` se acepta/expulsa en la respuesta y sin `dueDate` -> 400 `errors.recurrence`; verificar `mvn -Dtest=ErrorContractIntegrationTest test` (rojo). Skills: `tdd`.
- [x] 2.2 Agregar `recurrence`/`recurrenceSourceId` a `Task`, campos DTO y migracion `V6`; verificar `mvn -Dtest=ErrorContractIntegrationTest test` (verde). Skills: `tdd`.

## 3. Backend — generacion al completar (TDD)

- [x] 3.1 (red) `TaskServiceTest`/integracion que fallen: completar una recurrente crea UN hijo `PENDING` con la fecha avanzada y `recurrenceSourceId`; re-completar no duplica; `NONE` no crea nada; verificar `mvn -Dtest=TaskServiceTest test` (rojo). Skills: `tdd`.
- [x] 3.2 Implementar la generacion en la transicion a COMPLETED dentro de la transaccion existente; verificar `mvn -Dtest=TaskServiceTest,RecurringApiIntegrationTest test` (verde). Skills: `tdd`.

## 4. Frontend (TDD)

- [x] 4.1 (red) `AddTaskModal.test.tsx` que falle: el selector de recurrencia llega a `TaskInput.recurrence`; verificar `npx vitest run src/__tests__/AddTaskModal.test.tsx` (rojo). Skills: `tdd`.
- [x] 4.2 Implementar el selector de recurrencia y el indicador "se repite" en `KanbanCard`; verificar `npx vitest run src/__tests__/AddTaskModal.test.tsx` (verde). Skills: `tdd`, `frontend-design`.

## 5. Verificacion

- [x] 5.1 `mvn test`, `npm test -- --run`, `npm run build`; confirmar verde (depende de 1–4).
