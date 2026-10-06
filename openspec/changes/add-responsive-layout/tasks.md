# Tasks

> Skills: `frontend-design` (layout responsive); `tdd` en la parte verificable.

## 1. Tokens y layout (frontend-design)

- [ ] 1.1 Agregar tokens de breakpoint a `frontend/src/styles/theme.css`; verificar `npm run build`. Skills: `frontend-design`.
- [ ] 1.2 Reglas responsive para el board, header, columnas y modal en los `*.module.css`; verificar `npm run build`. Skills: `frontend-design`.
- [ ] 1.3 Tamaños de toque (>=40px) en `KanbanCard`/botones; verificar `npm test -- --run` verde. Skills: `frontend-design`.

## 2. Verificacion visual (E2E)

- [ ] 2.1 Agregar un project de viewport movil en `playwright.config.ts` y baselines `toHaveScreenshot` del board y modal; con el stack levantado, `npx playwright test e2e --update-snapshots` y luego `npx playwright test e2e` (verde).
- [ ] 2.2 Aseverar que no hay overflow horizontal de la pagina a 360px (con `page.evaluate` de `scrollWidth <= innerWidth`).
- [ ] 2.3 `npm test -- --run` y `npm run build`; confirmar verde.
