# Proposal — Board UX improvements

## Why

El board no responde "¿qué hago ahora?": sin conteos, due date gris indistinto, drag invisible, tags que cuestan 4 pasos y no filtran, modal que acepta título vacío, errores genéricos sin acción, y columnas vacías mudas. Todo verificado contra el código actual (solo lectura): `TodoListPage` agrupa sin contar, `KanbanCard` muestra `dueDate` plano, `handleDrop` sin highlight, `AddTaskModal.handleSubmit` sin validación, `friendlyTagError` genérico, sin skeletons ni empty states.

## What Changes

- Board: conteos tabulares por columna + total; due-state (`overdue | today | future | none`) calculado en el frontend desde `dueDate`; filtro por tag en header (multi-select, filtra tasks que contengan alguno); drop highlight visible + confirmación del `move` (rollback visible ya existe, se le suma aviso).
- Modal: validación inline de título (no submit vacío, mensaje junto al campo); crear+y-asignar tag en un paso; confirmación al borrar tag asignado a N tareas; reconciliación ya existente se conserva.
- Auth/reset: botón copiar-token (`navigator.clipboard` + confirmación), errores con acción (`Reintentar`, `Pedir otro código` como link existente + texto que dirige).
- Carga/vacío: skeletons durante `loadTasks`/`loadTags` (el flag `loading` ya existe, sin UI); empty states con acción por columna vacía y board vacío.
- Todo sobre tokens del cambio 1 (lo hereda visualmente gratis en los 3 temas).

## Capabilities

### New Capabilities

(Ninguna — son comportamientos de capacidades existentes.)

### Modified Capabilities

- `frontend-integration`: Task List View (+conteos, +filtro tag, +due-states, +skeletons, +empty states), Create Task Form (+validación inline), Delete Task Functionality (+confirm en tag asignado), Tag Creation/Deletion from Modal (+un paso, +confirm), Frontend Password Reset Pages (+copiar-token, +errores accionables).

## Impact

- Módulos: `frontend/src/pages/TodoListPage.tsx`, `frontend/src/components/{AddTaskModal,KanbanCard,KanbanColumn}.tsx` + sus `.module.css`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, tests Vitest (unit de due-state/filtro/validación + integración).
- Sin cambios backend, rutas, contrato API ni textos fuera de los nuevos mensajes (que nacen en español — ver cambio 3 para el resto).
- Cambio mediano-grande (~6 ficheros + tests) pero una sola seam (board); no se subdivide porque las piezas comparten estado de página. Depende del cambio 1.

## Non-goals

- Temas/skins (cambio 4), español del resto de la UI (cambio 3), mover tareas por teclado (futuro), notificaciones/push.

## Rollback plan

Revert del commit. Solo frontend; rollback seguro.
