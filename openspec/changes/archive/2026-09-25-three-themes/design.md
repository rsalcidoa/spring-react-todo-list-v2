# Design — Tres temas con selector

## Context

Ver proposal.md (Why). Base: contrato de tokens (1), UX compartida (2), copy ES (3). Previews validados en `/tmp/redesign-10-proposals-v2.html` (1 Ink, 5 Phosphor, 6 Nord).

## Goals / Non-Goals

**Goals:** 3 skins fieles a los previews, selector persistente, baselines que fijen la apariencia.
**Non-Goals:** resto de previews, tipografías nuevas, auto-tema.

## Decisions

1. **`[data-theme]` en root + 3 stylesheets** (vs clases por componente). Un atributo, cero cambios JSX salvo montarlo; los skins solo actúan bajo el atributo → rollback visual seguro y default intacto sin él.
2. **Valores + 3 tratamientos acotados** (vs solo valores). Phosphor: mono en metadata + glow `text-shadow` contenido; Nord: `backdrop-filter` esmerilado; Ink: dots + `tabular-nums`. Nada más: la disciplina del plan validado (un elemento memorable, resto quieto).
3. **Persistencia `localStorage.theme`, default `ink`** (vs SO). Determinista y testeable; `prefers-color-scheme` queda como futuro documentado.
4. **Baselines Playwright commiteados** (vs solo manual). `e2e/__screenshots__` por tema × (board, modal, login); el gate los compara; la matriz 3×5 se acepta una vez a mano y luego es automática.
5. **Regla anti-deriva en el PR, no en archivo nuevo** (vs CONTRIBUTING). Menos burocracia: la task exige documentarla donde el repo revise PRs; si no hay sitio, va al cuerpo del commit/PR que cierre el cambio.

## Risks / Trade-offs

- [Flaky visual por fuentes/animaciones] → deshabilitar animaciones en test (`prefers-reduced-motion` + CSS estable), tolerancia de diff mínima, fuentes del sistema en CI si Inter remota falla.
- [e2e requiere backend] → baselines con backend de `docker compose` como el resto de e2e; si el entorno no lo permite, capturas manuales + documentar.
- [Tercer tema a medias] → la matriz 3×5 es gate, no sugerencia: sin sus 5 capturas no se archiva.

## Migration Plan

Sin migraciones. Rollback: revert (sin `data-theme` todo se ve como antes). Último de la tanda (1→2→3→4).

## Test strategy

- Unit: ThemeContext (default, cambio, persistencia, lectura inicial).
- Visual: Playwright por tema × página con baselines commiteados; matriz manual 3×5 de aceptación.
- Gates: `npx vitest run && npm run build` + visual en verde.
