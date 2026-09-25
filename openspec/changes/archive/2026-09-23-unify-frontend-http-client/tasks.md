# Tasks

## 1. Unificar imports de axios en AuthContext

- [x] 1.1 Reemplazar en `frontend/src/context/AuthContext.tsx`: importar `api` desde `../services/ApiService`; reemplazar `axios.post('/v1/auth/login', { email, password })` por `api.post('/auth/login', { email, password })`; eliminar `import axios from 'axios'`. Verificar con `cd frontend && npx vitest run && npm run build`.

## 2. Unificar imports de axios en AuthService

- [x] 2.1 Reemplazar en `frontend/src/services/AuthService.ts`: importar `api` desde `./ApiService`; reemplazar `import('axios').then(({default:axios})=>axios.post('/v1/auth/register',{email,password}))` por `api.post('/auth/register',{email,password})`; eliminar el `import('axios')` dinámico. Verificar con `cd frontend && npx vitest run && npm run build`.

## 3. Mejorar catch en RegisterPage

- [x] 3.1 Mejorar catch en `frontend/src/pages/RegisterPage.tsx`: destructurar `error` en catch; si `error.response?.status === 409` → `alert(error.response.data?.error || 'Este email ya está registrado')`; else → mantener `alert('Error en registro')`. Verificar con `cd frontend && npx vitest run && npm run build`.

## 4. Tests unitarios

- [x] 4.1 Crear `frontend/src/__tests__/AuthContext.test.tsx` (vitest+RTL+happy-dom, patrón `vi.mock('../services/ApiService')`): mock `api.post('/auth/login')` → `{ data: { token: 'jwt123' } }`; verificar `setToken('jwt123')`, `setUser(email)`, `localStorage.setItem('jwt','jwt123')`, `localStorage.setItem('email',email)`; probar onError. Depende de 1.1. Verificar con `cd frontend && npx vitest run AuthContext` (frontend/).
- [x] 4.2 Crear `frontend/src/__tests__/RegisterPage.test.tsx` (vitest+RTL+happy-dom, patrón de `TodoListPage.test.tsx`): mock `api.post('/auth/register')` → `Promise.reject({ response: { status: 409, data: { error: 'Este email ya está registrado' } } })`; verificar `alert('Este email ya está registrado')`; mock `api.post('/auth/register')` → `Promise.reject({ response: { status: 500 } })`; verificar `alert('Error en registro')`. Depende de 2.1 y 3.1. Verificar con `cd frontend && npx vitest run RegisterPage` (frontend/).

## 5. Gate frontend completo

- [x] 5.1 Gate frontend (todos los tests + build). Depende de 4.1, 4.2. Verificar con `cd frontend && npx vitest run && npm run build`.
