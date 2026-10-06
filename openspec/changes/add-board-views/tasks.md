# Tasks

> Skills: `tdd` en cada tarea funcional (red-green-refactor); `frontend-design` en el selector.

## 1. Frontend — seam de vistas (TDD)

- [x] 1.1 (red) Escribir `frontend/src/__tests__/boardView.test.ts` que falle: `Hoy`, `Vencidas`, `Próximas` (limites +7/+8), exclusion de COMPLETED y tareas sin fecha; verificar `npx vitest run src/__tests__/boardView.test.ts` (rojo). Skills: `tdd`.
- [x] 1.2 Crear `frontend/src/services/boardView.ts` con `BoardView` y `filterByView(tasks, view, today)` reutilizando `dueState`; verificar `npx vitest run src/__tests__/boardView.test.ts` (verde). Skills: `tdd`.

## 2. Frontend — selector en el tablero (TDD)

- [x] 2.1 (red) Extender `TodoListPage.test.tsx` que falle: seleccionar `Hoy`/`Vencidas`/`Próximas` acota las tareas visibles y compone con el filtro de etiqueta; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx` (rojo). Skills: `tdd`.
- [x] 2.2 Agregar el selector de vista (Todas/Hoy/Vencidas/Próximas) en el header y componer `filterByView` con los filtros existentes; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx` (verde). Skills: `tdd`, `frontend-design`.

## 3. Verificación

- [x] 3.1 Correr `npm test -- --run` y `npm run build`; confirmar verde (depende de 1–2).
- [x] 3.2 (opcional) Extender `e2e/full-flow.spec.ts` con el selector de vista; con el stack levantado verificar `npx playwright test e2e`.
