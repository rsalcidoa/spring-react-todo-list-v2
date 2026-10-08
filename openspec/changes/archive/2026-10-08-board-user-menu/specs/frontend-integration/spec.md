# Spec Delta

## ADDED Requirements

### Requirement: Visible Active User
The board header SHALL show the signed-in user as an avatar with the initial of
their email and a tooltip naming the email. Activating the avatar SHALL open a
menu that shows the email and a "Log out" action; logging out SHALL end the
session and navigate to the login screen.

**ID**: REQ-FE-031
**Affected files**:
- `frontend/src/components/UserMenu.tsx` — avatar, tooltip and menu
- `frontend/src/pages/TodoListPage.tsx` — replaces the standalone logout button

#### Scenario: Avatar shows the user's initial
- **WHEN** the board renders for `ana@example.com`
- **THEN** the header shows an avatar with `A` and the tooltip names `ana@example.com`

#### Scenario: Menu exposes identity and logout
- **WHEN** the user opens the avatar menu
- **THEN** it shows the email and a "Log out" action

#### Scenario: Logout ends the session
- **WHEN** the user chooses "Log out"
- **THEN** the session is cleared and the app navigates to `/login`
