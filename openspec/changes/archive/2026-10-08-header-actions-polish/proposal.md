# Proposal — Header action order and project button style

## Why

The "New project" button sits after "New task" and, because it is an outline
using the border token (`rgba(255,255,255,0.08)` on dark themes), it reads as
unstyled text. It should come first and look like a proper secondary button.

## What Changes

- Move "New project" before "New task" in the header actions.
- Give it a visible secondary style: `--color-surface` background with a visible
  border and a primary-colored hover.

**Non-goals:** changing what the actions do; new buttons.

**Rollback plan:** revert the JSX order and the CSS. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: `Header Project Action and Drag Feedback` — the
  project action precedes the task action and is a styled secondary button.

## Impact

- **Frontend (TS):** `frontend/src/pages/TodoListPage.tsx` (+ `.module.css`),
  tests, visual baselines.
