# Proposal

## Why

Status notifications use ARIA incorrectly. The undo bar is `role="status"` (a non-interactive live region) but contains a `Deshacer` button (`TodoListPage.tsx:254`), so screen readers/assistive tech may not expose the control reliably; the affordance also auto-dismisses after 5s regardless of focus/attention (WCAG 2.2.1). Loading uses a second `role="status"` region. Found as S4 during verification.

## What Changes

- Announce transient status ("Tarea eliminada", loading) through a **non-interactive** polite live region that contains no controls.
- Render the undo button **outside** the live region and **move focus to it** when it appears.
- **Pause the auto-dismiss timer while the undo button has focus** (and reset it on blur), so keyboard/screen-reader users have time to act.
- Mark the board `aria-busy` while loading instead of relying only on a skeleton live region.

**Non-goals:**
- A full WCAG audit or changes to the toast (`ErrorBanner`) `role="alert"`, which is appropriate.
- Changing the inline field-error roles (kept as-is for now).

**Rollback plan:** revert the board markup/effects and the `sr-only` class. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: adds an "Accessible Status Announcements" requirement.

## Impact

- **Frontend (TS/CSS):** `frontend/src/pages/TodoListPage.tsx`, `frontend/src/pages/TodoListPage.module.css` (a visually-hidden `.srOnly` class), tests.
- **API/Backend:** none.
