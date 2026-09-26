# Tasks — Board UX improvements

## 1. Board: conteos, due-states, filtro, drop, carga

- [x] 1.1 Crear `getDueState` pura + conteos tabulares + chips de due-state en `KanbanCard`, y verificar unit de los 4 estados en verde
- [x] 1.2 Filtro por tag en header, drop highlight visible + aviso de rollback, skeletons y empty states con CTA, y verificar tests de integración en verde

## 2. Modal + reset + cierre

- [x] 2.1 Validación inline de título, crear+y-asignar en un paso, confirm con conteo al borrar tag asignado, y verificar tests en verde
- [x] 2.2 Copiar-token con fallback y errores accionables en reset, suite `npx vitest run && npm run build` en verde, screenshots actualizados y archivar con `openspec archive`
