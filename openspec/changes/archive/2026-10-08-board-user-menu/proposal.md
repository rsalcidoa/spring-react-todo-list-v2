# Proposal — Show the active user in the board header

## Why

Nothing on the board indicates which user is signed in. `AuthContext` already
exposes `user` (the email) but the page only uses `logout`.

## What Changes

- Add a `UserMenu` component: an avatar with the email's initial (tooltip shows
  the email) that opens a small menu showing the email and a "Log out" action.
- Replace the standalone logout button in the board header with `UserMenu`.

**Non-goals:** profile editing, avatars/images, account settings, server
changes.

**Rollback plan:** restore the standalone logout button and drop the component.
Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds "Visible Active User".

## Impact

- **Frontend (TS):** new `frontend/src/components/UserMenu.tsx` (+ `.module.css`),
  `frontend/src/pages/TodoListPage.tsx`, tests.
