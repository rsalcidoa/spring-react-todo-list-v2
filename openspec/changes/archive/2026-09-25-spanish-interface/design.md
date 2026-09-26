# Design — Interfaz en español

## Context

Ver proposal.md (Why + glosario normativo). Inventario medido: ~50 cadenas únicas en `pages/*.tsx`, `components/AddTaskModal.tsx`, `TAG_ERROR_FALLBACKS` y mapeos; backend intacto.

## Goals / Non-Goals

**Goals:** cero inglés visible; glosario como fuente única; tests fijando el copy.
**Non-Goals:** i18n, backend, temas.

## Decisions

1. **Español hardcodeado, sin librería** (vs react-intl). Un idioma = la librería sería seam hipotética (un solo adapter, cero leverage). Si algún día hay segundo idioma, ese cambio introduce la infra.
2. **Traducción en el borde, por código** (vs tocar backend). `toDisplayMessage`/fallbacks ya mapean por status; `ResetPasswordPage` compara `code`. Los cuerpos backend en inglés nunca llegan crudos a la vista.
3. **Barrido por glosario + grep de verificación** (vs reescritura libre). Tras el cambio, `grep` de las ~50 cadenas EN originales debe dar cero hits en `src/` salvo valores wire (`LOW`, `PENDING`) y código.
4. **Tests como contrato de copy** (vs snapshots). Se actualizan `getByText/getByRole/placeholder` + e2e; el gate los fija.

## Risks / Trade-offs

- [Textos largos rompen layout] → `Guardar/Cancelar` y `Cerrar sesión` son más largos; verificar screenshots (los temas llegan después, pero el layout base debe respirar ya).
- [e2e en inglés] → `full-flow.spec.ts` se traduce a la par; corre en el gate si el entorno lo permite, si no queda documentado.
- Orden: después del cambio 2 (sus textos nacen ES), antes del 4 (baselines visuales con ES).

## Migration Plan

Sin migraciones. Rollback: revert. Tercero de la tanda.

## Test strategy

- `npx vitest run` con textos ES (falla si falta alguna cadena).
- `grep` de cero-EN como check manual documentado en la tarea.
- `npm run build` + screenshots para el cambio 4.
