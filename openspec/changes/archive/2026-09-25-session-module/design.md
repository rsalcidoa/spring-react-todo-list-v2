# Design — One session module

## Context

Ver `proposal.md` (Why). Estado: `ApiService.ts:6-24` interceptores con `localStorage` + `window.location` inline; `AuthContext.tsx:14-31` mismas keys con `useState`; tests (`AuthContext.test`, `RegisterPage.test`) mockean `api.post`, nunca la política 401.

## Goals / Non-Goals

**Goals:** un dueño para keys y política 401; interceptores delgados; política testeable sin red.
**Non-Goals:** cambiar keys/rutas/flujo; refresh tokens.

## Decisions

1. **Módulo `services/session.ts` plano (funciones, no clase)** (vs clase singleton). El repo usa funciones exportadas en `ApiService`; una clase añadiría seam hipotética (un solo adapter: `localStorage`). Funciones puras sobre storage inyectable por parámetro opcional → testeables con fake sin mockear globales salvo `window.location` en un test.
2. **`handleUnauthorized(url): boolean`** (vs void). Retorna si actuó (navegó) para que el interceptor sepa y los tests lo aserten sin espiar navegación global en cada caso; el caso `/auth/login` retorna false y rechaza.
3. **`AuthContext` conserva su interface** (vs exponer el módulo). Solo cambia el interior (`saveSession`/`clearSession`/`getToken`); `user/token/login/logout` intactos → tests existentes siguen verdes con ajustes mínimos de mock.
4. **Sin segundo adapter de storage**. `localStorage` directo con override opcional para tests; un adapter completo sería hipotético.

## Risks / Trade-offs

- [`window.location.href` en tests] → mock por test con restore; patrón ya usado (`window.confirm` en page tests).
- [Navegación en jsdom] → asignar `href` lanza "not implemented" en jsdom salvo mock; el test mockea el setter o espía. Detalle de implementación con verificación en su tarea.
- Ningún cambio observable: mismos códigos, misma navegación, mismas keys.

## Migration Plan

Sin migraciones. Rollback: revert. Independiente de B, C, D (ficheros disjuntos salvo `ApiService.ts`, que B no toca).

## Test strategy

- `session.test.ts`: header injection (vía `getToken`), clear+redirect en 401 no-login, no-redirect en `/auth/login`, login/logout delegan.
- `AuthContext.test.tsx` existente en verde.
- Gates: `npx vitest run && npm run build`.
