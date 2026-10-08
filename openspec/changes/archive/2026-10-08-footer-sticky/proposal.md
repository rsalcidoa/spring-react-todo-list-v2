# Proposal — Keep the footer visible while scrolling

## Why

The board can be taller than the viewport, so the footer is only visible after
scrolling to the bottom. It should stay visible.

## What Changes

- Make `.page` a flex column with `min-height: 100vh`.
- Make the footer **sticky** to the bottom: `position: sticky; bottom: 0`, an
  opaque `--color-surface` background, `z-index` below the modals, keeping the
  top border.
- Result: the footer stays pinned to the viewport bottom while scrolling and
  settles at the end when content is short.

**Non-goals:** a fixed overlay footer (would cover content and need padding);
footer on auth screens.

**Rollback plan:** remove the sticky/flex rules; the footer returns to the end
of the content. Frontend-only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: `Application Footer` — the footer stays visible while
  the board scrolls.

## Impact

- **Frontend (TS):** `frontend/src/components/AppFooter.module.css`,
  `frontend/src/pages/TodoListPage.module.css`, visual baselines.
