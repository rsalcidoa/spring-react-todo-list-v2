# Tasks — One session module

## 1. Módulo + delegación

- [x] 1.1 Crear `frontend/src/services/session.ts` (`getToken/saveSession/clearSession/handleUnauthorized`) con `session.test.ts` cubriendo 401 (navega+limpia), exclusión de `/auth/login` e inyección de header, y verificar `npx vitest run session` en verde
- [x] 1.2 Delegar interceptores de `ApiService` y persistencia de `AuthContext` al módulo, y verificar `npx vitest run && npm run build` en verde

## 2. Cierre

- [x] 2.1 Sincronizar delta (`frontend-integration`) con `openspec archive` (tras apply) y verificar `openspec validate --strict`
