# Proposal — Design tokens foundation

## Why

Los estilos usan literales (`#fff` ×12, `rgba(0,175,169,…)` ×8, hex sueltos) repartidos en 10 ficheros `.module.css` más `theme.css`. Sin un contrato de tokens es imposible sostener 3 temas ni evitar regresiones visuales: cada color nuevo sería otro literal.

## What Changes

- Contrato de ~25 tokens en `frontend/src/styles/theme.css` (`--bg`, `--surface`, `--line`, `--text`, `--muted`, `--accent`, `--st-pending/active/done`, `--pr-high/med/low`, `--due-over/today`, `--tag-*`, `--danger`, `--radius*`, `--shadow*`, `--font-display/body`).
- Migración de los 10 `.module.css` + estilos inline a vars. Cero cambios visuales: el default renderiza idéntico al actual.
- Regla documentada: todo color nuevo entra como token, nunca literal.

## Capabilities

### New Capabilities

(Ninguna — cambio de infraestructura visual.)

### Modified Capabilities

- `frontend-integration`: API Integration — nota de que los estilos consumen el contrato de tokens (sin cambio de escenarios; se añade escenario de no-regresión visual contra screenshot actual).

## Impact

- Módulos: `frontend/src/styles/theme.css`, los 10 `.module.css`, estilos inline en TSX si los hay.
- Sin cambios de lógica, rutas, textos ni comportamiento. Riesgo: regresión visual accidental — mitigado con screenshot antes/después en la tarea.
- Base obligatoria de los cambios 2, 3 y 4 (orden: este primero).

## Non-goals

- Ningún rediseño visible, ningún tema nuevo, ninguna mejora UX, ningún texto.
- Nuevos tokens fuera del contrato (~25); si un cambio posterior necesita uno, lo propone allí.

## Rollback plan

Revert del commit. Solo CSS; rollback seguro.
