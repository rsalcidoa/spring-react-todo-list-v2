# Design

## Context

See `proposal.md` — Why. The board is a CSS-module grid with no media queries; `theme.css` holds design tokens. E2E already captures visual baselines per theme (from `add-real-visual-regression`'s pattern, `playwright.config.ts` + `toHaveScreenshot`), which can be extended with a mobile viewport project.

## Goals / Non-Goals

**Goals:**
- A single set of breakpoint tokens and a board that degrades cleanly on small screens.
- Touch-friendly targets and working drag on touch.

**Non-Goals:**
- Desktop visual changes, tablet-specific tweaks, native packaging.

## Decisions

1. **Horizontal scroll for the board on small screens, columns keep their width** (chosen), rather than stacking columns vertically.
   - Rationale: a Kanban reads better as columns; stacking hides the "board" model and breaks cross-column drag.
   - Alternative: stack columns — rejected: degrades the core interaction.
2. **Breakpoint tokens in `theme.css`** (`--bp-sm: 640px`, `--bp-md: 1024px`) (chosen) instead of per-module literals.
   - Rationale: one source of truth, consistent with the existing token discipline.
3. **Full-screen modal under `--bp-sm`** (chosen).
   - Alternative: keep the centered dialog — rejected: unusable on phones.
4. **Visual verification via a Playwright mobile viewport baseline** (chosen) since CSS layout is otherwise untested.
   - Alternative: assert class names — rejected: brittle and low-signal.

## Risks / Trade-offs

- [Drag-and-drop on touch is unreliable in some browsers] -> keep the keyboard move from `add-quick-add-and-keyboard` as the accessible alternative; verify with a mobile baseline.
- [Horizontal scroll can hide the first/last column] -> add scroll affordance and snap the header controls above the board.

## Migration Plan

Frontend-only, no API/data change. Rollback reverts the CSS modules and tokens.

## Test Strategy

- **Component (frontend):** assert the responsive wrapper/classes render (smoke).
- **E2E (Playwright):** add a mobile viewport project and `toHaveScreenshot` baselines for the board and modal; assert no horizontal page overflow.
