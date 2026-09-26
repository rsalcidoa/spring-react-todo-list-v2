# Tasks — Design tokens foundation

## 1. Contrato + migración

- [x] 1.1 Definir el contrato (~25 tokens) en `theme.css` y migrar los 10 `.module.css` + inline a vars, y verificar `npx vitest run && npm run build` en verde
- [x] 1.2 Capturar baselines Playwright (board, modal, login) antes/después y verificar diff visual vacío; archivar con `openspec archive`
