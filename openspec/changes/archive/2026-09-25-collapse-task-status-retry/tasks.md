# Tasks — Collapse task retry, prune dead status operation

## 1. Refactor interno (requiere cambio B aplicado)

- [x] 1.1 Extraer helper de retry único para `createTask`/`updateTask`, borrar el overload muerto `patchStatus` (verificando cero usos), y verificar `mvn test` en verde
- [x] 1.2 Plegar los tests duplicados de `patchStatus` sobre `applyStatus`, correr suite completa `docker compose up -d && cd backend && mvn test` en verde, y archivar con `openspec archive`
