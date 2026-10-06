# Tasks

> Skills: `tdd` en cada tarea funcional; `frontend-design` en el input de quick-add y el foco del modal.

## 1. Quick add (TDD)

- [x] 1.1 (red) Escribir `QuickAddTask.test.tsx` que falle: Enter crea con el status de la columna y `priority=LOW`, titulo vacio se bloquea sin request, fallo muestra ErrorBanner; verificar `npx vitest run src/__tests__/QuickAddTask.test.tsx` (rojo). Skills: `tdd`.
- [x] 1.2 Crear `frontend/src/components/QuickAddTask.tsx`, renderizarlo en `KanbanColumn` con el status y conectarlo a `repository.create` en `TodoListPage`; verificar `npx vitest run src/__tests__/QuickAddTask.test.tsx` (verde). Skills: `tdd`, `frontend-design`.

## 2. Navegacion por teclado (TDD)

- [x] 2.1 (red) Escribir `boardKeyboard.test.ts` que falle: `nextStatus` avanza/retrocede y es no-op en los extremos; verificar `npx vitest run src/__tests__/boardKeyboard.test.ts` (rojo). Skills: `tdd`.
- [x] 2.2 Implementar `frontend/src/services/boardKeyboard.ts`; verificar `npx vitest run src/__tests__/boardKeyboard.test.ts` (verde). Skills: `tdd`.
- [x] 2.3 (red) Extender `KanbanCard`/`TodoListPage` tests que fallen: `Alt+Arrow` mueve y hace rollback al fallar, `Enter` abre el modal, y el foco se conserva tras el movimiento; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx` (rojo). Skills: `tdd`.
- [x] 2.4 Hacer las tarjetas focusables (`tabIndex`, `onKeyDown`, `aria-label`) y manejar el movimiento con el handler de status existente; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx` (verde). Skills: `tdd`.

## 3. Accesibilidad del modal (TDD)

- [x] 3.1 (red) Extender `AddTaskModal.test.tsx` que falle: `Esc` cierra y el titulo recibe foco al abrir; verificar `npx vitest run src/__tests__/AddTaskModal.test.tsx` (rojo). Skills: `tdd`.
- [x] 3.2 Implementar `Esc` + autofocus del titulo en `AddTaskModal`; verificar `npx vitest run src/__tests__/AddTaskModal.test.tsx` (verde). Skills: `tdd`, `frontend-design`.

## 4. Verificacion

- [x] 4.1 Correr `npm test -- --run` y `npm run build`; confirmar verde (depende de 1–3).
- [x] 4.2 Extender `e2e/full-flow.spec.ts`: quick-add, foco y movimiento con teclado; con el stack levantado verificar `npx playwright test e2e`.
