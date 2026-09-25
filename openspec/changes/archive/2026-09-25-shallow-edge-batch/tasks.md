# Tasks — Shallow-edge cleanup batch

## 1. Bordes honestos

- [x] 1.1 Borrar `frontend/src/services/AuthService.ts` con `api.post` directo en `RegisterPage`, actualizar `RegisterPage.test`, y verificar `npx vitest run RegisterPage` en verde
- [x] 1.2 Devolver `RegisterResponse(email)` en `AuthController.register` y mapear `AuthenticationException` → `401 {error}` en el handler, con tests MockMvc de ambos, y verificar `docker compose up -d && cd backend && mvn test` en verde

## 2. Cierre

- [x] 2.1 Correr suite frontend `npx vitest run && npm run build` en verde, sincronizar deltas (`user-authentication`, `frontend-integration` si aplica) con `openspec archive` (tras apply) y verificar `openspec validate --strict`
