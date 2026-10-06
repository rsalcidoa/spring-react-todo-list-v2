# Tasks

> Skills: `tdd` en cada tarea funcional; `frontend-design` en el selector de idioma.

## 1. Infra i18n (TDD)

- [ ] 1.1 (red) `i18n.test.ts` que falle: lookup, fallback a `es`, claves tipadas; verificar `npx vitest run src/__tests__/i18n.test.ts` (rojo). Skills: `tdd`.
- [ ] 1.2 Crear `frontend/src/i18n/{index.ts,es.ts,en.ts}` (contexto + `useT` + `TranslationKey`) y envolver `App` en el provider; verificar `npx vitest run src/__tests__/i18n.test.ts` (verde). Skills: `tdd`.
- [ ] 1.3 Selector de idioma con persistencia y deteccion de navegador; verificar `npx vitest run src/__tests__/i18n.test.ts` (verde). Skills: `tdd`, `frontend-design`.

## 2. Migrar paginas de auth (TDD)

- [ ] 2.1 Extraer las cadenas de `LoginPage`/`RegisterPage`/`ForgotPasswordPage`/`ResetPasswordPage` a `t(...)` manteniendo el texto `es` identico; verificar `npx vitest run src/__tests__/LoginPage.test.tsx src/__tests__/RegisterPage.test.tsx src/__tests__/ForgotPasswordPage.test.tsx src/__tests__/ResetPasswordPage.test.tsx`. Skills: `tdd`.

## 3. Migrar el tablero (TDD)

- [ ] 3.1 Extraer las cadenas de `TodoListPage`/`KanbanColumn`/`KanbanCard` y los filtros a `t(...)`; verificar `npx vitest run src/__tests__/TodoListPage.test.tsx`. Skills: `tdd`.

## 4. Modal y errores (TDD)

- [ ] 4.1 Extraer las cadenas de `AddTaskModal`/`ErrorBanner` y mapear los errores de API a mensajes localizados; verificar `npx vitest run src/__tests__/AddTaskModal.test.tsx src/__tests__/ErrorBanner.test.tsx`. Skills: `tdd`.
- [ ] 4.2 Formatear fechas/counts con `Intl` (reemplazar concatenaciones); verificar `npx vitest run src/__tests__/dueState.test.ts src/__tests__/TodoListPage.test.tsx`. Skills: `tdd`.

## 5. Verificacion

- [ ] 5.1 `npm test -- --run` y `npm run build` (el build debe fallar si falta una clave `es`); confirmar verde (depende de 1–4).
- [ ] 5.2 Con el stack levantado, `npx playwright test e2e` (las baselines `es` deben seguir pasando; agregar un smoke en `en`).
