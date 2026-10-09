# Spec Delta

## MODIFIED Requirements

### Requirement: Application Footer
The board SHALL render a footer showing the application name and version, the keyboard hints (`Alt+←/→` move, `Enter` edit, `Esc` close), a help control that opens the keyboard shortcuts dialog, a link to the project repository, and a copyright line. The footer SHALL use the active locale and theme tokens and SHALL NOT appear on the authentication screens. The footer SHALL stay visible at the bottom of the viewport while the board scrolls. The help control SHALL remain reachable on every viewport, including the small-screen layout where the text hints are hidden.

**ID**: REQ-FE-040
**Affected files**:
- `frontend/src/components/AppFooter.tsx` — the footer and the help trigger
- `frontend/src/components/AppFooter.module.css` — sticky positioning and the help control
- `frontend/src/pages/TodoListPage.tsx` — mounts the footer on the board

#### Scenario: Board shows the footer
- **WHEN** the board renders
- **THEN** the footer shows the app name and version, the keyboard hints, the help control, the repository link and the copyright line

#### Scenario: Open the shortcuts help from the footer
- **WHEN** the user activates the footer help control
- **THEN** the keyboard shortcuts dialog opens

#### Scenario: Help is reachable on small screens
- **WHEN** the viewport is narrow and the footer text hints are hidden
- **THEN** the help control is still visible and operable

#### Scenario: Footer stays visible while scrolling
- **WHEN** the board content is taller than the viewport and the user scrolls
- **THEN** the footer remains visible at the bottom of the viewport

#### Scenario: Localized footer
- **WHEN** the locale is English
- **THEN** the footer text renders in English

## ADDED Requirements

### Requirement: Keyboard Shortcuts Help
The board SHALL provide a keyboard shortcuts dialog that lists the supported shortcuts: focus a task card, open the focused card for editing (`Enter`), move the focused card between status columns (`Alt+ArrowLeft` / `Alt+ArrowRight`), close a dialog (`Esc`), and create a task from a column's quick-add input. The dialog SHALL be a modal (`role="dialog"` with `aria-modal="true"`), SHALL close on `Esc` and on an overlay click, and SHALL use the active locale. The shortcut list SHALL match the shortcuts the board actually implements.

**ID**: REQ-FE-042
**Affected files**:
- `frontend/src/components/ShortcutsModal.tsx` — the shortcuts dialog
- `frontend/src/components/ShortcutsModal.module.css` — dialog styling
- `frontend/src/i18n/es.ts`, `frontend/src/i18n/en.ts` — shortcut labels

#### Scenario: View the shortcuts
- **WHEN** the user opens the shortcuts dialog
- **THEN** it lists focusing a card, editing with `Enter`, moving with `Alt+ArrowLeft`/`Alt+ArrowRight`, closing with `Esc`, and quick-add

#### Scenario: Close the shortcuts dialog with Escape
- **WHEN** the shortcuts dialog is open and the user presses `Esc`
- **THEN** the dialog closes

#### Scenario: Close the shortcuts dialog from the overlay
- **WHEN** the shortcuts dialog is open and the user clicks the overlay outside the dialog
- **THEN** the dialog closes

#### Scenario: Shortcuts are localized
- **WHEN** the locale is English
- **THEN** the shortcut labels render in English
