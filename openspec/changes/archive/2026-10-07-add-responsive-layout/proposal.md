# Proposal

## Why

The board has no responsive rules (no `@media` anywhere), so on phones and narrow windows the three columns overflow, header controls collide, and the modal is unusable. Block F (alcance) makes the app usable away from a desktop.

## What Changes

- Responsive board: columns become horizontally scrollable / stacked on small screens; the header controls wrap; the modal becomes full-screen on narrow viewports.
- Add breakpoint tokens to `frontend/src/styles/theme.css` and use them in the CSS modules.
- Ensure comfortable touch targets and that drag-and-drop works with touch.

**Non-goals:**
- A native app, gestures beyond drag, or a tablet-specific layout.
- Changing any API or business behavior.

**Rollback plan:** revert the CSS modules and tokens; the desktop layout returns. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds a "Responsive Board Layout" requirement.

## Impact

- **Frontend (TS/CSS):** `frontend/src/pages/TodoListPage.module.css`, `frontend/src/components/*.module.css`, `frontend/src/styles/theme.css` (breakpoints); E2E visual baselines gain a mobile viewport.
- **API/Backend:** none.
