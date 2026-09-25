# Proposal — One session module

## Why

La invariante "dónde vive la sesión" está repartida: el interceptor axios lee/limpia `jwt`/`email` en `localStorage` y navega a `/login` en 401, mientras `AuthContext` guarda/limpia las mismas keys. La `interface` miente — promete `Promise.reject` pero esconde navegación global — y el `ErrorBanner` de la page nunca se muestra si el interceptor ya navegó. No hay tests de interceptores.

## What Changes

- Nuevo módulo sesión (`frontend/src/services/session.ts`): `getToken()`, `saveSession(token, email)`, `clearSession()`, `isAuthenticated()`, y `handleUnauthorized(url)` con la política 401 (limpia + navega, salvo `/auth/login`).
- `ApiService` interceptores delegan al módulo; `AuthContext` delega guardar/limpiar (conserva su `interface` React: `user/token/login/logout`).
- Tests del módulo sin DOM de red: storage fake + `window.location` mockeado; política 401 cubierta (limpia y navega; login excluido).

## Capabilities

### New Capabilities

(Ninguna.)

### Modified Capabilities

- `frontend-integration`: API Integration — la sesión y la política 401 viven en el módulo sesión; interceptor y contexto delegan (nota de interface, mismos códigos y navegación).

## Impact

- Módulos: `frontend/src/services/session.ts` (nuevo), `frontend/src/services/ApiService.ts` (interceptores), `frontend/src/context/AuthContext.tsx` (delegación), tests `session.test.ts`, `AuthContext.test.tsx`.
- Sin cambios de API backend, rutas ni UX observable (misma navegación a `/login`, mismas keys).
- Cambio pequeño (2 ficheros productivos + tests); no requiere split.

## Non-goals

- Cambiar keys, rutas o el flujo login/logout.
- Refresh tokens o expiración client-side (futuro, fuera de alcance).
- Contrato de error backend (cambio B), ownership (cambio C), bordes shallow (cambio D).

## Rollback plan

Revert del commit. Frontend puro, sin migraciones; rollback seguro.
