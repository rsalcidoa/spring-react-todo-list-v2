# Tasks — Deepen the board module

## 1. Seam + adapters (sin tocar callers)

- [x] 1.1 Extender `TaskRepository` (`createTag` con id real, `deleteTag`, `update` devuelve `Task`), mover conversión dentro de `HttpTaskRepository` y verificar `npx vitest run TaskRepository` en verde
- [x] 1.2 Igualar semántica `InMemoryTaskRepository` (trim+lower, rechazo en inexistente/duplicado) y unificar el suite compartido sin `instanceof`, y verificar `npx vitest run TaskRepository` en verde
- [x] 1.3 Crear `mapApiError` compartido y verificar unit cubriendo `409/400/404` y fallback

## 2. Callers (page + modal)

- [x] 2.1 Migrar `TodoListPage` (instancia compartida, usa `Task` devuelto, reconciliación única, rollback en `move`, confirm conservado) y verificar `npx vitest run TodoListPage` en verde sin mocks de `ApiService`
- [x] 2.2 Migrar `AddTaskModal` (tag ops vía repository, sin import de `ApiService`, sin ids falsos, error compartido) y verificar `npx vitest run AddTaskModal` en verde
- [x] 2.3 Plegar o documentar `DefaultClient`/`ApiClient` según deletion test, correr suite completa `npx vitest run && npm run build` en verde y archivar con `openspec archive`
