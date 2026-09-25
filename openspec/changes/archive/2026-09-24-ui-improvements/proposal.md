# Proposal

## Why

La aplicación tiene 4 deficiencias de UX que afectan la experiencia del usuario: email sin validación en frontend (acepta `mail@mail`), mensajes de error inconsistentes (alert nativo, console.error silencioso, banners mal estilizados), ausencia de gestión de tags más allá de la asignación a tareas, y status editable en creación de tarea.

## What Changes

- **Nuevo**: Componente ErrorBanner (toast flotante) — reemplaza alert() y console.error, estilo consistente
- **Nuevo**: Validación de formato de email en Login y Register — regex client-side `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- **Nuevo**: Input para crear tags en AddTaskModal — botón "Create", refresh automático
- **Nuevo**: Botón eliminar (×) en cada tag pill — llama a deleteTag(id), refresh de lista
- **Modificado**: Default de status en AddTaskModal — PENDING disabled en creación, editable al editar
- **Modificado**: LoginPage usa `styles.error` para mensajes (corrige uso actual de `styles.field`)

## Capabilities

### Modified Capabilities
- `frontend-integration`: ADD client-side email validation, ErrorBanner component, standardized error display, tag creation/deletion from modal, status default PENDING in task creation
- `tagging`: ADD user can create and delete tags from the task creation/editing modal UI

## Impact

**Frontend**:
- `src/components/ErrorBanner.tsx` — nuevo componente
- `src/components/ErrorBanner.module.css` — estilos del toast
- `src/pages/LoginPage.tsx` — validar email, corregir styles.error
- `src/pages/RegisterPage.tsx` — validar email, reemplazar alert() por ErrorBanner
- `src/components/AddTaskModal.tsx` — input crear tag, botón eliminar tags, status default
- `src/components/AddTaskModal.module.css` — estilos para crear tag, eliminar tag
- `src/pages/TodoListPage.tsx` — usar ErrorBanner en vez de console.error
- `src/services/ApiService.ts` — deleteTag ya existe, verificar call desde modal

**Tests**:
- Vitest: `ErrorBanner.test.tsx`, `AddTaskModal.test.tsx` (actualizar), `TodoListPage.test.tsx` (actualizar)

## Non-goals

- No implementar búsqueda o filtrado de tareas por tags
- No implementar reorganización de tags (rename, reorder)
- No implementar edición de propiedades de tag (solo crear y eliminar)

## Rollback Plan

- No hay breaking changes
- Revertir commits de components, pages, tests
- La migration de specs es reversible: delta specs en openspec/changes/ se eliminan, specs originales en openspec/specs/ se reverten manualmente
