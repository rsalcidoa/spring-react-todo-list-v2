# Design

## Context

See `proposal.md` — Why. `KanbanCard.tsx` mixes the card's markup with
presentation decisions and three hardcoded Spanish strings; the Due-state rules
now live in `boardQuery` (#2). The card has no dedicated test.

## Goals / Non-Goals

**Goals:**
- One pure place that answers "how does a Task present", localized.
- The card becomes a thin view; its labels come from i18n.

**Non-Goals:**
- Changing the card's markup, classes or interactions.
- Owning CSS class names in the module.

## Decisions

1. **`presentTask(task, t, lang): TaskPresentation`** returns semantic data —
   `completed`, `priorityLabel`, `dueState`, `dueLabel`, `recurrenceLabel`,
   `deleteLabel`, `progressLabel` — not CSS class names.
   - Rationale: CSS Modules hash the class names inside the card; the module stays
     pure and the card maps `dueState` → its own class.
   - Alternative: return class names — rejected: couples the module to CSS Modules.
2. **Priority labels via `t('priority.*')`** (already available); add
   `task.recurring` and `task.delete`.
   - Rationale: reuse the existing keys; the only new strings are the recurrence
     and delete labels.
3. **Due label composition stays in the module** (`board.overdue` / `board.today`
   prefix + `formatDate`), so the card renders one `dueLabel`.
4. **Remove `AVAILABLE_THEMES[].label`**: both selectors use `t('theme.*')`, so the
   field is dead duplicated data.

## Risks / Trade-offs

- [English output changes (the fix)] → only under `en`; default `es` output is
  identical, so visual baselines are unaffected.
- [Moving decisions out of the card] → cover with `taskPresentation.test.ts`
  (pure) and a new `KanbanCard.test.tsx` (rendered, `es` and `en`).

## Migration Plan

Frontend-only. Build with `npm run build`. Rollback restores the card's inline
labels.

## Test Strategy

- **Unit (Vitest):** `taskPresentation.test.ts` for Due state/label, Priority,
  Recurrence, delete label, progress, and locale.
- **Component (Vitest):** `KanbanCard.test.tsx` renders the localized labels and
  the completed treatment.
- **E2E (Playwright):** default `es` visuals unchanged; run the suite.
- **Backend:** none.
