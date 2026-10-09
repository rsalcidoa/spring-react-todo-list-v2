# Tasks

Frontend-only change; there are no backend tasks. Each functional task starts
with a failing test (TDD red) and ends with a verification command. Run the
frontend commands from `frontend/`.

## 1. Header action hierarchy (frontend)

- [x] 1.1 (red) Add `frontend/e2e/header-actions.spec.ts` asserting both header action buttons (`+ Tarea`, `Nuevo proyecto`) report the same height via `boundingBox()` and that the task action is filled while the project action is an outline; run `npx playwright test e2e/header-actions.spec.ts` with the stack up (red). Skills: `tdd`, `frontend-design`. *(depends on: none)*
- [x] 1.2 Implement the shared button box model (same padding, border width and an explicit `line-height: 1.2`) and the primary/secondary emphasis in `frontend/src/pages/TodoListPage.module.css`; verify 1.1's test passes. Skills: `frontend-design`. *(depends on: 1.1)*

## 2. Task dialog labels (frontend)

- [x] 2.1 (red) Extend `frontend/src/__tests__/AddTaskModal.test.tsx` to assert the "Etiquetas" label renders exactly once (heading removed, toggle is the label); run `npx vitest run src/__tests__/AddTaskModal.test.tsx` (red). Skills: `tdd`. *(depends on: none)*
- [x] 2.2 Remove the duplicated tags heading from `frontend/src/components/AddTaskModal.tsx`; verify 2.1 passes (green). Skills: `frontend-design`. *(depends on: 2.1)*
- [x] 2.3 Make `.formGroupFlex` stack its label over its control and drop the negative `.requiredMsg` top margin in `frontend/src/components/AddTaskModal.module.css`; verify `npx vitest run src/__tests__/AddTaskModal.test.tsx` stays green. Skills: `frontend-design`. *(depends on: 2.1)*

## 3. Visual baselines (frontend)

- [x] 3.1 Refresh and review the theme visual baselines (`e2e/__screenshots__/{ink,phosphor,nord}/board.png` and `modal.png`) and the responsive mobile baseline; run `npx playwright test e2e/themes-visual.spec.ts e2e/responsive.spec.ts --update-snapshots`, inspect each diff, then re-run without `--update-snapshots` (green). Skills: `frontend-design`. *(depends on: 1.2, 2.3)*

## 4. Integration verification

- [x] 4.1 Run `npm run build` and `npx vitest run` (green), then `npx playwright test e2e` with the stack up (green). Skills: `code-review`. *(depends on: 3.1)*

## 5. Tag block spacing (frontend)

- [x] 5.1 (red) Add `frontend/e2e/tag-section-layout.spec.ts` that opens the task dialog, expands the tag dropdown, and asserts the search input, option list and create-new-tag input do not overlap and are separated by a minimum vertical gap; run `npx playwright test e2e/tag-section-layout.spec.ts` with the stack up (red). Skills: `tdd`, `frontend-design`. *(depends on: 2.3)*
- [x] 5.2 Make `.tagSection` a flex column with a gap (`AddTaskModal.module.css`), make the board `.filterRow` stretch (`TodoListPage.module.css`), and align the `TagSelect` internal gaps (`TagSelect.module.css`); verify 5.1 passes (green). Skills: `frontend-design`. *(depends on: 5.1)*
- [x] 5.3 Refresh and review the modal visual baselines (and board if changed); run `npx playwright test e2e/themes-visual.spec.ts --update-snapshots`, inspect each diff, then re-run without `--update-snapshots`; run `npm run build` and `npx vitest run` (green). Skills: `frontend-design`. *(depends on: 5.2)*
