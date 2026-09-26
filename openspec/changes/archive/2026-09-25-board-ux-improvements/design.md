# Design — Board UX improvements

## Context

Ver `proposal.md` (Why). Estado: `TodoListPage` (`grouped`, `handleDrop`, `handleSave`, `handleDelete`, flag `loading` sin UI), `KanbanCard` (due chip plano), `AddTaskModal` (sin validación, 4 pasos para etiquetar, `friendlyTagError`), `ForgotPasswordPage` (token sin copiar), `ResetPasswordPage` (errores descriptivos). Todo estilado solo con tokens del cambio 1.

## Goals / Non-Goals

**Goals:** responder "qué hago ahora" de un vistazo; etiquetar en 1 paso; errores que dirigen.
**Non-Goals:** temas, español general (cambio 3), teclado para mover, backend.

## Decisions

1. **Due-state como función pura `getDueState(dueDate?, today): overdue|today|future|none`** (vs lógica en JSX). Testeable unit sin DOM ni fechas reales (fecha inyectada); card y conteos la consumen.
2. **Filtro por tag como estado de página (set de ids)** (vs query backend). Sin cambios API; filtra el `grouped` ya cargado; chips reutilizan estilo de pills.
3. **Validación inline en el modal, no en page** (vs validar al guardar). El modal posee el form; `handleSubmit` bloquea con mensaje de campo; el backend sigue siendo backstop (contrato intacto).
4. **Confirmar borrado de tag asignado con conteo** (vs borrar directo). `window.confirm` existente para tasks; mismo patrón con impacto ("usado en N tareas").
5. **Copiar con `navigator.clipboard` + fallback** (vs solo mostrar). Fallback a selección manual si el API no existe (jsdom/tests); confirmación "Copiado".
6. **Skeletons con el flag `loading` + empty states por columna/board** (vs spinner global). Reusa estado existente; CTA crea tarea/modal.

## Risks / Trade-offs

- [Fechas y timezone] → due-state compara solo `yyyy-MM-dd` local, sin horas; test con fecha fija.
- [Filtro + drag] → filtrar no mueve tareas; el drop sobre lista filtrada conserva lo no visible (no se pierde nada, solo vista).
- [Confirm nativo] → se mantiene `window.confirm` (ya mockeado en tests); custom dialog sería otro cambio.

## Migration Plan

Sin migraciones. Rollback: revert. Después del cambio 1 (tokens), antes del 3 (textos) y 4 (temas).

## Test strategy

- Unit: `getDueState` (4 estados + borde año bisiesto/no), filtro (alguno/ninguno/limpiar), validación título vacío, copiar (clipboard mock + fallback).
- Integración: drop highlight visible, rollback con aviso, crear+y-asignar en 1 paso, confirm con conteo, skeletons→contenido, empty CTA.
- Gates: `npx vitest run && npm run build` + screenshots Playwright actualizados.
