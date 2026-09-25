# Design — Deepen the board module

## Context

Ver `proposal.md` (Why). Estado: `TaskRepository.ts` expone `fetchAll/create/update/move/remove/listTags`; `update` devuelve `void` (`:99-101`); `DefaultClient` (`:61-80`) es pass-through a `ApiService`; `toWire/fromWire` (`:31-59`) son funciones libres; `TodoListPage` reconcilia tags en 3 sitios (`:69-73,:92-95,:174-177`) y crea `new HttpTaskRepository()` por render (`:20`); `AddTaskModal` importa `createTag/deleteTag` de `ApiService` (`:4`) y fabrica `{id: Date.now()}` (`:49-51`); tests mockean `ApiService` bajo la seam (`TodoListPage.test:13-24`, `AddTaskModal.test:7-10`) y el suite compartido ramifica por `instanceof` (`TaskRepository.test:85+`).

## Goals / Non-Goals

**Goals:** una `interface` honesta (ids reales, `update` devuelve `Task`, errores uniformes, misma semántica por adapter); page/modal como view + delegación; tests a través de la seam.
**Non-Goals:** cambios visuales; backend; tocar `ApiClient` más allá de plegarlo si queda shallow.

## Decisions

1. **Tag ops dentro de `TaskRepository` (vs módulo tag separado)**. El board es el único consumidor de tags en frontend; un módulo tag aparte sería una seam hipotética (un caller). `createTag/deleteTag` entran a la `interface` existente.
2. **`update` devuelve `Task`** (vs `void` + refresh). Elimina el parcheo manual y el segundo `loadTags()`; el adapter ya tiene la respuesta del PUT en la mano.
3. **Conversión dentro de `HttpTaskRepository`** (vs funciones libres). `toWire/fromWire` pasan a métodos del adapter; `ApiClient`/`DefaultClient` se eliminan si quedan como pass-through (deletion test en implementación; si aportan algo — p. ej. inyección para tests — se conservan documentados).
4. **Paridad semántica InMemory** (vs solo HTTP). `registerTags` con trim+lower, `move/remove` sobre inexistente rechazan, `createTag` duplicado → error equivalente a 409. El suite compartido deja de ramificar por `instanceof`: una sola superficie.
5. **Un `mapApiError`** (vs dos mapeos locales). `friendlyTagError` (modal) y `errorMessage` (page) colapsan a una función del módulo data; page/modal solo la muestran vía `ErrorBanner`.
6. **Instancia compartida del repository** (vs `new` por render). La page usa una instancia memoizada/inyectada; los tests inyectan `InMemoryTaskRepository` sin mocks de red.

## Risks / Trade-offs

- [Tests existentes mockean `ApiService`] → se reescriben a la seam (repository); es el punto del cambio, no regresión.
- [`ApiService` exporta `api` crudo (`:43`)] → fuera de alcance no cerrar esa fuga; se documenta como follow-up.
- [Rollback optimista de `move`] → el módulo rechaza el fallo; la page revierte estado local (behavior nuevo, cubierto por test).

## Migration Plan

Fase 1 (seam): interface extendida + adapters + `mapApiError`, suite compartido sin ramificación. Fase 2 (callers): page/modal migran, se borra el import directo y los ids falsos. Rollback: revert del commit (frontend puro).

## Test strategy

- `TaskRepository.test`: suite compartido único sobre la `interface` (ambos adapters, misma semántica, cero red en InMemory).
- `TodoListPage.test` / `AddTaskModal.test`: inyectan `InMemoryTaskRepository`; aserciones de reconcile con ids reales, rollback en `move` fallido, error compartido.
- Gates: `npx vitest run && npm run build` (Playwright solo si cambiara UI observable; no es el caso).
