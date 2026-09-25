# Design — Ownership behind CurrentUserProvider

## Context

Ver `proposal.md` (Why). Estado: `TaskService.findOwnedTask` reimplementa forbidden inline; `TagService.delete` usa `requireOwned`; `TaskServiceTest` mockea solo `requireCurrent`; `OwnershipApiIntegrationTest` cubre 403/404 vía HTTP.

## Goals / Non-Goals

**Goals:** una sola decisión forbidden; tests cruzando la seam real.
**Non-Goals:** mover lookups/404; cambiar firmas, controllers, códigos.

## Decisions

1. **Delegar solo el forbidden** (vs todo `findOwnedTask` al provider). El 404 nace del lookup del agregado (`findById`), que el módulo Task debe poseer; el provider no conoce aggregates. `findOwnedTask` queda: `findById orElseThrow(NotFound)` + `requireOwned(task.user.id)`.
2. **Sin cambios en controllers ni firmas** (vs simetrizar controllers). `TaskController` ya delega todo al servicio (correcto y delgado); `TagController` resuelve usuario para pasarlo (necesario por firmas actuales). Unificar firmas sería refactor mayor sin ganancia de `depth`.
3. **Tests: mock `requireOwned` en unit + un test con provider real** (vs solo HTTP). `TaskServiceTest` aserta que el forbidden sale del provider (mock que lanza); `OwnershipApiIntegrationTest` añade un caso que ejercita task+provider reales (ya es integración; solo documenta la cobertura de seam).

## Risks / Trade-offs

- [Mock que lanza vs lógica real] → el caso real queda cubierto por integración; el unit fija el cableado, no la regla.
- Ningún cambio observable: mismos códigos y cuerpos.

## Migration Plan

Sin migraciones. Rollback: revert. Independiente de A, B, D (solo toca `TaskService.findOwnedTask` + tests; D ya archivó su refactor del mismo fichero en otra zona).

## Test strategy

- `TaskServiceTest`: cross-user → `requireOwned` invocado con el owner id (mock lanza `OwnershipDeniedException`); not-found sin tocar el provider.
- `OwnershipApiIntegrationTest` en verde (contrato 403/404 intacto).
- Gates: `docker compose up -d && cd backend && mvn test`.
