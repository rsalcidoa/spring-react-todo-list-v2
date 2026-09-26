# Design — Design tokens foundation

## Context

Ver `proposal.md` (Why). Estado medido: `#fff` ×12, `rgba(0,175,169,…)` ×8 y ~15 hex sueltos en 10 `.module.css`; `theme.css` ya define una base parcial (`--color-*`, `--radius`, `--shadow`) que los módulos usan a medias.

## Goals / Non-Goals

**Goals:** un contrato completo, cero literales fuera de `theme.css`, cero cambio visual.
**Non-Goals:** temas, UX, textos.

## Decisions

1. **~25 tokens planos en `:root`** (vs anidados por tema). Un solo nivel, nombres por rol (`--due-over`, no `--red-500`): el rol sobrevive a los 3 temas; el valor cambia por tema después.
2. **Migración mecánica archivo por archivo** (vs rewrite). Cada literal → var existente o nueva del contrato; diff revisable por archivo; screenshot antes/después por página (Playwright ya instalado).
3. **Sin tokens de espaciado/tipografía nuevos** salvo `--font-display/body` (Inter en ambos por ahora): el type scale distintivo llega con los temas, no aquí.

## Risks / Trade-offs

- [Sombra/overlay `rgba(0,0,0,.5)` del modal] → token `--overlay`; el blur llega con temas.
- [Clases con `!important` (`priority-*`, `selected`)] → se conservan tal cual; limpiar especificidad es del cambio de temas si estorba.

## Migration Plan

Sin migraciones. Rollback: revert. Primero de la tanda (2, 3, 4 dependen).

## Test strategy

- `npx vitest run && npm run build` verdes (cero cambios lógicos).
- Playwright screenshots baseline (board, modal abierto, login) antes y después: diff vacío.
