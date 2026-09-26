# Proposal — Tres temas con selector

## Why

Con tokens (cambio 1), UX compartida (cambio 2) y copy ES (cambio 3) como base, los skins son valores + tratamientos acotados: Ink Pipeline (default, dirección validada), Phosphor Terminal y Nord Frost (elegidos por el usuario de entre 10). Sin infra de temas, cada skin sería un fork.

## What Changes

- `frontend/src/styles/themes/{ink,phosphor,nord}.css` bajo `[data-theme="…"]`: valores del contrato + tratamientos propios ( Phosphor: mono solo en metadata + glow contenido; Nord: blur esmerilado; Ink: pipeline con dots + conteos tabulares). Inter en los tres (cambio de familia no paga).
- `ThemeContext` + selector en el header del board + persistencia `localStorage` (`theme`, default `ink`).
- Baselines visuales Playwright por tema × página clave (board, modal abierto, login) commiteados; matriz de aceptación 3×5 (temas × board/modal/login/toast-error/empty).
- Regla documentada (en `tasks`/PR, sin archivo nuevo salvo que el repo pida sitio): todo color nuevo entra como token; PR visual exige screenshots de los 3 temas.

## Capabilities

### New Capabilities

(Ninguna — presentación de capacidades existentes.)

### Modified Capabilities

- `frontend-integration`: Task List View (+selector de tema persistente en el header; default Ink Pipeline), resto sin cambio de escenarios — los baselines por tema fijan la apariencia.

## Impact

- Módulos: `frontend/src/styles/themes/*.css` (nuevos), `frontend/src/context/ThemeContext.tsx` (nuevo), `TodoListPage.tsx` (selector + `data-theme`), tests `theme.test.*`, baselines `e2e/__screenshots__` (nuevos, commiteados a propósito).
- Sin cambios de lógica, textos, rutas ni API. Depende de los cambios 1–3 (tokens, UX, ES). Último de la tanda.
- Cambio mediano (3 skins + infra + baselines); una sola seam (presentación), no se subdivide.

## Non-goals

- Los otros 7 previews (descartados por el usuario).
- Cambio de familia tipográfica, modo auto por SO (futuro), temas custom por usuario.

## Rollback plan

Revert del commit. Solo frontend; `data-theme` ausente = estilos default intactos (los skins solo actúan bajo el atributo).
