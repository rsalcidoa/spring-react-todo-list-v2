# Proposal

## Why

The board header and the task modal have visual inconsistencies that hurt
scanability and make the primary action harder to read: the secondary "Nuevo
proyecto" button is drawn slightly larger than the primary "+ Tarea" action, and
modal labels are cramped against their controls (and duplicated for tags). Fixing
them is small, frontend-only and removes friction from the two most-used surfaces.

## What Changes

- **Header action hierarchy (REQ-FE-039)**: "Nuevo proyecto" and "+ Tarea" share
  the same box model (padding, font size, line height, border width and radius),
  so they render at the same size. "+ Tarea" is the filled primary action;
  "Nuevo proyecto" stays an outline, muted secondary action. The label is not
  shortened and the order (project before task) is unchanged.
- **Tag picker label (REQ-FE-038)**: the task modal no longer renders a separate
  "Etiquetas:" section heading; the `TagSelect` toggle is the single visible
  label. The `aria-label` for the control stays "Etiquetas".
- **Modal form layout (new requirement)**: in the modals, each label sits above
  its control with consistent separation; the priority/status pair stacks label
  over control instead of running inline; the inline validation message no longer
  overlaps its field.

**Non-goals**:
- No changes to the header action order, the project/task behavior, or the
  `TagSelect` interaction model.
- No redesign of the auth pages or the Manage projects dialog (they already stack
  labels correctly).
- No shortening of the "Nuevo proyecto" label.
- No backend, API, or data-model changes.

**Scope**: frontend UI/layout only.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `frontend-integration`: REQ-FE-039 (header action hierarchy) and REQ-FE-038
  (tag picker label) are tightened, and a new "Modal Form Layout" requirement
  (REQ-FE-041) is added.

## Impact

Affected frontend files (TS/CSS):
- `frontend/src/pages/TodoListPage.module.css` — shared header button box model
  and primary/secondary emphasis.
- `frontend/src/components/AddTaskModal.tsx` / `AddTaskModal.module.css` — remove
  the duplicated tags heading, stack `.formGroupFlex`, drop the negative
  `.requiredMsg` margin.
- Tests: `frontend/src/__tests__/AddTaskModal.test.tsx` (label lookup).
- Visual baselines under `frontend/e2e/__screenshots__/` (board/modal, three
  themes) are expected to change and must be refreshed.

No API, dependency, or backend impact. Fits the established frontend conventions:
CSS Modules + design tokens only (no literal colors), single-page error handling
untouched, and pure presentational changes over the existing components.

**Rollback plan**: revert the CSS/JSX edits and restore the previous visual
baselines; no data or API migration is involved.

> Note: this change is the first of two; the second,
> `add-keyboard-shortcuts-help`, adds the in-app shortcut help. They are split
> because together they touch more than three files.
