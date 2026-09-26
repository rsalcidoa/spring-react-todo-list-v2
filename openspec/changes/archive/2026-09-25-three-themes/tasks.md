# Tasks — Tres temas con selector

## 1. Skins + selector

- [x] 1.1 Crear `themes/{ink,phosphor,nord}.css` bajo `[data-theme]` fieles a los previews 1/5/6, y verificar inspección visual contra preview en cada uno
- [x] 1.2 Crear `ThemeContext` + selector en header + persistencia, con unit tests, y verificar `npx vitest run` en verde

## 2. Baselines + cierre

- [x] 2.1 Commitear baselines Playwright por tema × (board, modal, login), aceptar matriz 3×5, suite `npx vitest run && npm run build` + visual en verde, y archivar con `openspec archive`
