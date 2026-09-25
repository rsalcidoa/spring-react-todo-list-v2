# Proposal: Unify frontend HTTP client

## Why

Las llamadas de autenticación no pasan por la instancia compartida de Axios (`frontend/src/services/ApiService.ts`): `AuthContext.tsx` importa `axios` global y llama `axios.post('/v1/auth/login', ...)` directamente, y `AuthService.ts` usa `import('axios')` dinámico + axios global para `registerUser()`. La spec de `frontend-integration` → "API Integration" exige que **todas** las llamadas usen la instancia compartida `axios.create({ baseURL: '/v1' })` que incluye el interceptor de autenticación y el manejador de 401. Además, `RegisterPage.tsx` tiene un catch genérico `alert('Error en registro')` que no muestra el mensaje estructurado del backend (409 → "Este email ya está registrado"), y la spec exige mostrar el mensaje del cuerpo de respuesta.

## What Changes

- **`AuthContext.tsx`**: reemplazar `axios.post('/v1/auth/login', ...)` por `api.post('/auth/login', ...)` (el `/v1` lo da la `baseURL`; quitar import de axios global).
- **`AuthService.ts`**: reemplazar `import('axios')` dinámico + axios global por `api.post('/auth/register', ...)` (quitar el `import('axios')`, usar la instancia compartida de ApiService).
- **`RegisterPage.tsx`**: catch mejorado — si `error.response?.status === 409` → mostrar `error.response.data.error` (fallback "Este email ya está registrado"); resto → mensaje genérico actual ("Error en registro").
- **Tests**: nuevos `AuthContext.test.tsx` y `RegisterPage.test.tsx` (vitest + RTL, patrón `vi.mock` de `TodoListPage.test.tsx`): mock de ApiService, login exitoso, re-registro con 409 muestra mensaje correcto.

## Non-goals

- `ApiService.ts` intacto (ya cumple con la instancia compartida, interceptores y manejo de 401).
- No hay cambios de backend (el 409/400 se implementan en `establish-api-error-contract`, C5).
- No se extrae un módulo repository (→ `extract-frontend-task-repository`, C6).
- No hay cambios de Playwright/e2e.

## Capabilities

### Modified Capabilities

- **frontend-integration**: `API Integration` — `AuthContext.tsx` y `AuthService.ts` pasan a usar la instancia compartida de ApiService; preservar los 2 scenarios existentes ("Axios Interceptor Adds Auth Header to All Requests", "Unauthenticated User Redirects to Login"); escenario opcional nuevo "Auth calls use the shared API instance".

### New Capabilities

- (ninguna)

## Impact

| Capa | Módulos afectados |
|------|-------------------|
| **Frontend TS** | `frontend/src/context/AuthContext.tsx` (axios global → api.shared), `frontend/src/services/AuthService.ts` (import('axios') → api.shared), `frontend/src/pages/RegisterPage.tsx` (catch mejorado) |
| **Backend Java** | ninguno |
| **Dependencias** | ninguna nueva |
| **API** | sin cambios de contrato (el FE solo consume el 409/400 existentes) |

## División del cambio (regla >3 archivos)

Este cambio toca 3 archivos frontend. Se consideró dividirlo en (a) unificar axios y (b) mejorar catch de RegisterPage, pero la mejora del catch depende de que RegisterPage use registerUser() vía la instancia compartida (para leer `error.response`); separarlos dejaría una versión incompleta donde registerUser() usa axios global y no tiene el interceptor de 401. Decisión: un solo cambio con 3 tareas verificables.

## Rollback Plan

- Revertir el commit restaura el comportamiento anterior (axios global + import dinámico). No hay esquema que revertir: solo TypeScript.
- El interceptor de 401 de ApiService (que ahora manejará auth) sigue intacto; al rollback, AuthContext.tsx y AuthService.ts vuelven a axios global (sin interceptor).
