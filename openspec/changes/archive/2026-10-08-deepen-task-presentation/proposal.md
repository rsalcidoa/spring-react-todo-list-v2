# Proposal

## Why

“How a Task presents” is decided inside the card: `KanbanCard` hardcodes the
Priority labels (`Baja/Media/Alta`), the Recurrence label (`Se repite`) and the
delete `aria-label` (`Borrar tarea`), bypassing the i18n module that already
provides `priority.*`. The Due-state label logic is mixed into the same view.
Switching to English therefore leaves part of a card in Spanish, and the card has
no dedicated test.

## What Changes

- **New pure module `services/taskPresentation.ts`**: `presentTask(task, t, lang)`
  returns the card's presentation (completed treatment, Priority label, Due state
  and label, Recurrence label, delete label, subtask progress).
- **`KanbanCard` becomes a thin view** over that module; the labels come from
  `useT()` and the Due-state class is chosen from the returned state.
- **Localize the card**: Priority, Recurrence and the delete `aria-label` follow
  the active locale (fixes the Spanish leak under `en`).
- **Drop the dead hardcoded theme labels** (`AVAILABLE_THEMES[].label`), which no
  consumer reads (both selectors use `t('theme.*')`).

**Non-goals**:
- No visual change in the default (`es`) locale; the card layout and classes stay.
- No new i18n locale; no change to the i18n provider or the card's interactions
  (drag, keyboard, delete).
- No backend change.

**Scope**: `frontend/src`.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `frontend-integration`: REQ-FE-028 (UI Localization) is extended to make the
  Task card's Priority, Recurrence and delete labels explicitly part of
  localization.

## Impact

Affected files:
- `frontend/src/services/taskPresentation.ts` (new) — the presentation module.
- `frontend/src/components/KanbanCard.tsx` — thin view over the module.
- `frontend/src/context/ThemeContext.tsx` — remove the dead theme labels.
- `frontend/src/i18n/es.ts`, `frontend/src/i18n/en.ts` — `task.recurring`,
  `task.delete`.
- `frontend/src/__tests__/taskPresentation.test.ts`,
  `frontend/src/__tests__/KanbanCard.test.tsx` (new).

No API or dependency impact. Aligns the card with REQ-FE-028; follows the
localization convention (one central i18n layer, typed keys).

**Rollback plan**: restore the card's inline labels; no data or API migration.

> Fourth of five architectural deepenings. Independent of the others.
