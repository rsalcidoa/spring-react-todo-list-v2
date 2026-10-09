# Proposal

## Why

The board already supports keyboard operation (`Tab` to focus a card, `Enter` to
edit, `Alt+←/→` to move a task between columns, `Esc` to close dialogs, plus the
per-column quick-add), but the only surface that mentions it is a one-line hint in
the footer. There is nowhere to consult the full set of shortcuts, and the hint is
hidden on small screens — so the accessibility work is effectively undiscoverable.

## What Changes

- **Shortcut help dialog (new requirement)**: an in-app dialog that lists the
  supported keyboard shortcuts (focus a card, edit, move between columns, close,
  quick-add). It opens from a help affordance, is a proper `role="dialog"` with
  `aria-modal`, and closes on `Esc` and on an overlay click.
- **Footer help affordance (REQ-FE-040)**: the board footer gains a "?" / help
  control that opens the dialog. It stays reachable on every viewport, including
  the small-screen layout where the footer's text hints are hidden.
- **Localization**: the dialog and its trigger are translated in Spanish and
  English using the existing i18n keys.
- **Documentation**: a "Keyboard shortcuts" section in `README.md`.

**Non-goals**:
- No global shortcuts, command palette, or customizable keybindings.
- No change to the existing shortcut behavior or key choices.
- No full focus trap (tracked as a separate concern).
- No backend, API, or data-model changes.

**Scope**: frontend UI + docs only.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `frontend-integration`: a new "Keyboard Shortcuts Help" requirement
  (REQ-FE-042) is added, and REQ-FE-040 (Application Footer) is extended with the
  help affordance.

## Impact

Affected frontend files (TS/CSS) and docs:
- `frontend/src/components/ShortcutsModal.tsx` / `ShortcutsModal.module.css` —
  new dialog listing the shortcuts.
- `frontend/src/components/AppFooter.tsx` / `AppFooter.module.css` — help trigger
  and dialog mounting.
- `frontend/src/i18n/es.ts`, `frontend/src/i18n/en.ts` — new shortcut keys.
- `README.md` — "Keyboard shortcuts" section.
- Tests: `frontend/src/__tests__/ShortcutsModal.test.tsx` (new) and an extension
  of `frontend/src/__tests__/AppFooter.test.tsx`.
- Visual baselines under `frontend/e2e/__screenshots__/` change because the
  footer renders a new control.

No API, dependency, or backend impact. Fits the frontend conventions: CSS Modules
with design tokens, one component per file, and localized copy through `useT`.
The dialog is a new shallow presentational module reusing the existing
`role="dialog"` + `Esc` pattern from the task modal.

**Rollback plan**: remove the dialog, footer trigger, i18n keys and README
section, and restore the previous visual baselines; no data or API migration.

> Note: this change is the second of two; `fix-action-hierarchy-and-form-labels`
> handles the header/modal consistency. They are split because together they
> touch more than three files.
