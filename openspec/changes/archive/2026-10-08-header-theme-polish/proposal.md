# Proposal — Header layout and theme polish

## Why

Three UI issues share a theme/contrast root:
- The `UserMenu` and the auth `AppControls` use `var(--color-surface-raised)`,
  a token that is **not defined** in `theme.css` or any theme. An invalid
  `background` leaves those controls transparent, so the avatar does not stand
  out and the login theme/language selectors read as faint text.
- The "New task" primary action sits at the end of the filter/sort row, so it
  reads as just another filter.

## What Changes

- Define the missing `--color-surface-raised` token in `theme.css` and in the
  `ink`, `phosphor` and `nord` themes.
- Make the avatar stand out with the accent background and on-accent initial.
- Give the login/register/forgot/reset selectors a readable raised surface and
  text color.
- Split the board header into two groups: **actions** (New task — a primary
  button — and the user menu) and **filters** (search, view, project, priority,
  sort, language, theme).

**Non-goals:** new controls or filters; changing filter/sort semantics; new
themes.

**Rollback plan:** revert the touched frontend files; the layout and colors
return to the current state. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: `Task List View` (header grouping) and
  `Visible Active User` (avatar prominence).

## Impact

- **Frontend (TS):** `frontend/src/styles/theme.css`,
  `frontend/src/styles/themes/{ink,phosphor,nord}.css`,
  `frontend/src/components/UserMenu.module.css`,
  `frontend/src/components/AppControls.module.css`,
  `frontend/src/pages/TodoListPage.tsx` (+ `.module.css`), tests, visual baselines.
