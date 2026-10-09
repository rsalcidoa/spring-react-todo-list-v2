# Design

## Context

See `proposal.md` — Why. The affected surfaces are presentational: the header
action buttons in `TodoListPage.module.css` and the task dialog in
`AddTaskModal.tsx` / `AddTaskModal.module.css`. Styling follows CSS Modules plus
the design tokens in `frontend/src/styles/theme.css`; there is no component
library and no literal colors. The board renders one `AppFooter` and the task
dialog is a plain `role="dialog"` panel.

## Goals / Non-Goals

**Goals:**
- Restore the intended action hierarchy in the header without changing order or
  behavior.
- Make dialog labels legible and consistently spaced, and remove the duplicated
  tags label.
- Keep the change frontend-only and reversible.

**Non-Goals:**
- Introducing a shared `Button` component or a design-token refactor.
- A full focus trap or other dialog accessibility work (separate concern).
- Changing `TagSelect`'s interaction; only its role as the visible label in the
  modal changes.

## Decisions

1. **Shared box model via a joint selector** in `TodoListPage.module.css`
   (`.newTaskBtn, .projectBtn { ... }`) rather than duplicating properties.
   - Rationale: both actions must stay the same size; a single rule keeps them in
     sync.
   - Alternative: a new reusable `Button` component — rejected as too large for a
     two-button fix.
2. **Equal height via the same border and an explicit `line-height`**:
   `.newTaskBtn` gets `border: 1px solid var(--color-primary)` (same 1px width as
   the project outline) and both actions set `line-height: 1.2`.
   - Rationale: `line-height: normal` let the fullwidth `＋` / `…` glyphs in the
     project label inherit taller fallback-font metrics, making the button 4px
     taller; a fixed line height removes that. The matching border keeps the
     padded height equal (the project button was previously 1px taller without a
     border on the primary).
   - Alternative: `min-height` on both — rejected: does not fix the glyph-driven
     line box.
3. **Reuse `.formGroup`'s column layout for `.formGroupFlex`** by giving it
   `display: flex; flex-direction: column; gap: 0.25rem` and keeping `flex: 1`.
   - Rationale: the priority/status pair already shares `.row`; making each cell
     stack label-over-control fixes the cramped inline rendering without touching
     the JSX.
   - Alternative: per-field CSS — rejected as duplication.
4. **Remove the tags section heading in `AddTaskModal.tsx` and let the
   `TagSelect` toggle be the label.** The toggle already renders `task.tags`
   ("Etiquetas:") and exposes it as `aria-label`.
   - Alternative: keep the heading and relabel the toggle — rejected: adds a
     redundant control label and more churn.
5. **Drop the negative top margin on `.requiredMsg`** so validation copy sits
   below its field instead of overlapping it.
6. **Make `.tagSection` a flex column and let the tag control stretch.** Give
   `.tagSection` `display: flex; flex-direction: column; gap: 0.5rem` so the
   `TagSelect` becomes a stretched flex item (full width) and the create-new-tag
   row is separated from the dropdown. Mirror it on the board with
   `.filterRow { display: flex; flex-direction: column; align-items: stretch }`.
   - Rationale: `.wrap` is `inline-flex`, so it stayed at content width and sat
     flush against `.newTagRow`; the flex column fixes both width and spacing
     without changing the shared `TagSelect` API.
   - Alternative: add a `block` prop to `TagSelect` — rejected as unnecessary when
     the parent can stretch it.

## Risks / Trade-offs

- [Visual baselines change for board and modal in all three themes] → refresh
  them deliberately and review each diff; they are expected outputs, not
  failures.
- [Stacking priority/status increases the dialog height on small screens] →
  verify against the mobile layout / responsive e2e and the modal's full-screen
  breakpoint.
- [A test locates the tag control by the text "Etiquetas"] → keep the toggle
  label text and `aria-label` unchanged so existing queries stay valid.

## Migration Plan

Frontend-only, no data or API migration. Deploy with the normal build
(`npm run build`). Rollback reverts the CSS/JSX edits and restores the previous
visual baseline images.

## Test Strategy

- **Component (Vitest + Testing Library):** the task modal renders the
  "Etiquetas" label exactly once; existing AddTaskModal behaviors stay green.
- **E2E (Playwright):** refresh and review the theme visual baselines
  (`board.png`, `modal.png`) and the responsive mobile baseline; assert the two
  header buttons report equal height via `boundingBox()`; and assert the tags
  block does not pile up (search, option list and create input do not overlap,
  with a minimum vertical gap) with the dropdown open.
- **Backend:** none (no backend impact).
