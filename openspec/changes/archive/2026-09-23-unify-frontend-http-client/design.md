# Design

## Context

Estado actual (motivación en proposal.md — Why):

- `ApiService.ts` — instancia compartida `api = axios.create({ baseURL: '/v1' })` con request interceptor (Bearer token) + response interceptor (401 → clear + redirect). Exporta todas las funciones CRUD y `{ api }`.
- `AuthContext.tsx` (~:2) — importa `axios` global; `login()` (~:18) llama `axios.post('/v1/auth/login', ...)` directamente (ignora `baseURL` y los interceptores de ApiService). (G8a)
- `AuthService.ts` (~:3) — `import('axios')` dinámico + `axios.post('/v1/auth/register', ...)` (ignora ApiService). (G8b)
- `RegisterPage.tsx` (~:19) — catch genérico `alert('Error en registro')`; no lee `error.response.data` ni el estado HTTP. La spec de `user-authentication` exige mostrar "Este email ya está registrado" en 409.
- Patrón de test: vitest + @testing-library/react + happy-dom; `vi.mock('../services/ApiService')`, `vi.mock('../context/AuthContext')`, `MemoryRouter`, fake `localStorage` en helper `renderWithProvider`.
- Script `test` = `vitest` (watch — usar `npx vitest run` para CI); `build` = `vite build`.

## Goals / Non-Goals

**Goals:**

- Todas las llamadas de auth (login, register) pasan por la instancia compartida de ApiService.
- RegisterPage muestra el mensaje estructurado del backend en 409.
- Tests unitarios para AuthContext y RegisterPage (mock de ApiService).

**Non-Goals:**

- No se modifica `ApiService.ts` (ya cumple).
- No se extrae un módulo repository → `extract-frontend-task-repository` (C6).
- No hay cambios de backend.
- No hay tests e2e Playwright.

## Diagrama de flujo (antes vs. después)

```mermaid
flowchart LR
    subgraph Before[Before]
        direction TB
        A[AuthContext] -->|axios global| B[/v1/auth/login]
        C[AuthService] -->|import('axios')| D[/v1/auth/register]
        E[ApiService] -->|no se usa en auth| F[CRUD only]
    end
    subgraph After[After]
        direction TB
        G[AuthContext] -->|api.shared| H[/auth/login]
        I[AuthService] -->|api.shared| J[/auth/register]
        K[ApiService] -->|baseURL /v1| L{interceptor: Bearer + 401}
        H --> L
        J --> L
    end
```

## Decisions

### D1 — AuthContext y AuthService usan `api` de ApiService

- `AuthContext.login()`: `api.post('/auth/login', { email, password })` (quitado `import axios`).
- `AuthService.registerUser()`: `api.post('/auth/register', { email, password })` (quitado `import('axios')`).
- `api` se importa desde `../services/ApiService` (export `{ api }`).
- Alternativas:
  - (a) Copiar la configuración de `api` en AuthContext/AuthService — descartado: duplicación de configuración, riesgo de desincronización.
  - (b) Crear una nueva instancia `authApi` — descartado: rompe la regla de la spec ("every call must use the shared api instance").

### D2 — RegisterPage catch: leer `error.response?.status` y `error.response.data.error`

- `if (error.response?.status === 409)` → mostrar `error.response.data.error` (fallback "Este email ya está registrado").
- `else` → mantener el catch genérico `alert('Error en registro')`.
- Alternativas:
  - (a) Mostrar solo mensajes predefinidos (sin leer el cuerpo del backend) — descartado: la spec de `user-authentication` exige el mensaje del backend ("Este email ya está registrado").
  - (b) Toast/snackbar — descartado: cambio de UI más amplio (no-goal de C3).

### D3 — Patrón de test: vi.mock de ApiService

- Nuevo `AuthContext.test.tsx` y `RegisterPage.test.tsx`: patrón `vi.mock('../services/ApiService')` con mocks de `api.post` que resuelven con `data.token` (para login) o `data` (para register); uso de `renderWithProvider` con `MemoryRouter`.
- Alternativas:
  - (a) Mock directo de `axios` — descartado: no prueba la integración real con ApiService.
  - (b) Integration tests con `msw` — descartado: fuera de alcance de C3 (unit tests bastan).

## Estrategia de tests por capa

- **Unit (vitest + RTL + happy-dom)**:
  - `AuthContext.test.tsx` — mock de `api.post('/auth/login')` con `{ data: { token: 'jwt' } }`; verificar `setToken`, `setUser`, localStorage.setItem; catch de error → no lanza.
  - `RegisterPage.test.tsx` — mock de `api.post('/auth/register')` → 409 con `{ error: 'Este email ya está registrado' }`; verificar que se muestra el mensaje en el alert (RTL); mock de `api.post('/auth/register')` → error genérico; verificar mensaje genérico.
- **Integration**: ninguno (los cambios están confinados a componentes React + servicio).
- **e2e (Playwright)**: ninguno.

## Risks / Trade-offs

- [Algunos tests existentes mockean `AuthContext` directamente] → no afectados: los tests de `TodoListPage` ya mockean `AuthContext` y ApiService; los nuevos tests mockean ApiService y prueban AuthContext en aislamiento.
- [AuthService era usado por RegisterPage via import named] → no cambia: la firma de `registerUser(email, password)` es idéntica; solo cambia el inner implementation.
- [El interceptor de 401 de ApiService ahora intercepta register] → esperado y deseado: si el token expira durante register, la redirección a login es correcta.

## Migration Plan

- Deploy: commit único, sin backend; `npm run build` en frontend.
- Rollback: revert del commit restaura axios global + import dinámico.
- Orden en el portfolio: este cambio va tercero (C1); asume el 409 de `establish-api-error-contract` (C5) para el catch en RegisterPage.

## Open Questions

- (ninguno)
