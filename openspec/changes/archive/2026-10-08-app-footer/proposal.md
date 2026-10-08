# Proposal — Application footer on the board

## Why

The board has no footer. A slim footer gives the app identity, the version, a
pointer to the repo and quick keyboard hints.

## What Changes

- Add a footer on the board (only) with: app name + version, keyboard hints
  (`Alt+←/→` move, `Enter` edit, `Esc` close), a link to the repository, and
  `© {year} — All rights reserved`.
- Use i18n keys and theme tokens; keep it compact on narrow viewports.

**Non-goals:** a footer on the auth screens; a sticky/overlay bar.

**Rollback plan:** remove the footer component and its mount. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds "Application Footer".

## Impact

- **Frontend (TS):** new `frontend/src/components/AppFooter.tsx` (+ css),
  `frontend/src/pages/TodoListPage.tsx`, `i18n/{es,en}.ts`, tests, baselines.
