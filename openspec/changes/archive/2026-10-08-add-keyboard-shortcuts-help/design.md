# Design

## Context

See `proposal.md` — Why. The shortcuts already exist: `KanbanCard` is a focusable
`role="button"` handling `Enter` and `Alt+ArrowLeft/Right`, dialogs close on
`Esc`, and the per-column quick-add is a form. The footer (`AppFooter.tsx`) is a
small presentational component mounted only on the board by `TodoListPage`. The
task modal already demonstrates the `role="dialog"` + `Esc` + overlay pattern to
mirror.

## Goals / Non-Goals

**Goals:**
- Make the implemented shortcuts discoverable in-app and in the README.
- Keep the dialog reachable when the footer's text hints are hidden.
- Reuse existing dialog conventions; add no dependencies.

**Non-Goals:**
- A generic modal abstraction, focus trap, or command palette.
- Changing any existing shortcut or adding new ones.

## Decisions

1. **New dedicated `ShortcutsModal` component** instead of extracting a shared
   `Modal`.
   - Rationale: two dialogs with different content do not justify an abstraction;
     a shallow presentational module is enough.
   - Alternative: a shared `Modal` wrapper — deferred until a third dialog exists.
2. **Dialog state lives inside `AppFooter`** via a local `useState`.
   - Rationale: the trigger and the dialog are the same footer concern; no other
     consumer needs the state, so lifting it to `TodoListPage` would add prop
     drilling for nothing.
   - Alternative: lift to the page — rejected as premature.
3. **Trigger lives in the footer's right cluster**, not with the `.hints` text.
   - Rationale: the `@media (max-width: 640px)` rule hides `.hints`; the right
     cluster stays visible, satisfying the small-screen requirement.
   - Trigger is a button whose accessible name comes from i18n and shows a "?"
     glyph.
4. **Static shortcut table** rendered from a small array of `{ keys, labelKey }`
   entries, keys in `<kbd>` elements and labels via `useT`.
   - Rationale: keeps copy localized and the list easy to keep in sync with the
     implementation.
5. **Focus behavior**: on open, move focus into the dialog (`tabIndex={-1}` +
   effect); on close, return focus to the trigger.
   - Rationale: matches the accessible pattern without a full focus trap, which
     stays a separate concern.

## Risks / Trade-offs

- [Footer gains a control, so board visual baselines change] → refresh the theme
  baselines deliberately and review the diff.
- [`AppFooter` becomes stateful, changing a previously pure component] → cover
  open/close behavior with a component test and keep the dialog self-contained.
- [Coupling between the README/shortcut list and the real handlers can drift] →
  list only the shortcuts asserted by existing tests, and note the list's source
  in the README.

## Migration Plan

Frontend-only, no data or API migration. Deploy with the normal frontend build.
Rollback removes the dialog, trigger, i18n keys and README section, and restores
the previous baselines.

## Test Strategy

- **Component (Vitest + Testing Library):** new `ShortcutsModal.test.tsx` for
  rendering the shortcut list, `Esc` close and overlay close; extend
  `AppFooter.test.tsx` to open the dialog from the help control.
- **E2E (Playwright):** refresh the board baselines (footer changed); optionally
  open the dialog in `full-flow.spec.ts`.
- **Docs:** verify the README "Keyboard shortcuts" section matches the listed
  shortcuts.
- **Backend:** none (no backend impact).
