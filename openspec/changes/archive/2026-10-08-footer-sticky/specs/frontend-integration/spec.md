# Spec Delta

## MODIFIED Requirements

### Requirement: Application Footer
The board SHALL render a footer showing the application name and version, the keyboard hints (`Alt+←/→` move, `Enter` edit, `Esc` close), a link to the project repository, and a copyright line. The footer SHALL use the active locale and theme tokens and SHALL NOT appear on the authentication screens. The footer SHALL stay visible at the bottom of the viewport while the board scrolls.

**ID**: REQ-FE-040
**Affected files**:
- `frontend/src/components/AppFooter.tsx` — the footer
- `frontend/src/components/AppFooter.module.css` — sticky positioning
- `frontend/src/pages/TodoListPage.tsx` — mounts the footer on the board

#### Scenario: Board shows the footer
- **WHEN** the board renders
- **THEN** the footer shows the app name and version, the keyboard hints, the repository link and the copyright line

#### Scenario: Footer stays visible while scrolling
- **WHEN** the board content is taller than the viewport and the user scrolls
- **THEN** the footer remains visible at the bottom of the viewport

#### Scenario: Localized footer
- **WHEN** the locale is English
- **THEN** the footer text renders in English
