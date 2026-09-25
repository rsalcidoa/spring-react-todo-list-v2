# Proposal — Ownership behind CurrentUserProvider

## Why

La regla found/not-found/forbidden vive duplicada: `TaskService.findOwnedTask` reimplementa `findById + orElseThrow + !id.equals → Denied` sin usar `requireOwned`, mientras `TagService.delete` sí lo usa. `TaskController` nunca toca el provider y `TagController` sí en cada endpoint. Ningún test cruza la `seam` real task+provider (`TaskServiceTest` mockea solo `requireCurrent`).

## What Changes

- `TaskService.findOwnedTask` delega la parte forbidden en `currentUser.requireOwned(task.getUser().getId())` (mantiene el `findById + orElseThrow` para el 404, que es decisión de lookup, no de ownership).
- `TagService` recibe el usuario ya resuelto igual que hoy (sin cambio de firma); `TagController` se mantiene.
- `TaskServiceTest` + `TagServiceTest`/`OwnershipApiIntegrationTest`: ownership verificado a través del provider mockeado (`requireOwned`), no solo `requireCurrent`; un test cruza task+provider con `CurrentUserProvider` real sobre repo real.
- Sin cambios de API, códigos, shapes ni firmas públicas.

## Capabilities

### New Capabilities

(Ninguna.)

### Modified Capabilities

- `user-authentication`: REQ-TO-001/REQ-UAC-001 — nota de interface: la decisión forbidden vive en `CurrentUserProvider.requireOwned` para tasks y tags (sin cambio de escenarios).

## Impact

- Módulos: `com.example.todo.service.TaskService` (solo `findOwnedTask`), tests `TaskServiceTest`, `OwnershipApiIntegrationTest` (+ quizá `CurrentUserProviderTest`).
- Sin cambios observables: mismos 403/404/401. Cambio pequeño (1 método + tests); no requiere split. Independiente de A, B, D.

## Non-goals

- Mover el lookup (`findById`/404) al provider — el 404 es decisión del módulo dueño del agregado, no de ownership.
- Cambiar firmas de servicio o controllers.
- Contrato de error (cambio B), sesión (cambio A), bordes (cambio D).

## Rollback plan

Revert del commit. Sin migraciones; rollback seguro.
