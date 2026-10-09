# Tasks

Frontend change; no backend tasks. Each functional task starts with a failing
test (TDD red) and ends with a verification command. Run frontend commands from
`frontend/`.

## 1. The task presentation module (frontend)

- [x] 1.1 (red) Add `frontend/src/__tests__/taskPresentation.test.ts` (Due state/label, Priority, Recurrence and delete labels, progress, `es` and `en`) and `frontend/src/__tests__/KanbanCard.test.tsx` (renders the localized labels and the completed treatment); run `npx vitest run src/__tests__/taskPresentation.test.ts src/__tests__/KanbanCard.test.tsx` (red). Skills: `tdd`. *(depends on: none)*
- [x] 1.2 Implement `frontend/src/services/taskPresentation.ts`, refactor `frontend/src/components/KanbanCard.tsx` to a thin view, add `task.recurring` / `task.delete` to `frontend/src/i18n/es.ts` and `en.ts`, and remove the dead `AVAILABLE_THEMES[].label` in `frontend/src/context/ThemeContext.tsx`; verify 1.1 passes (green). Skills: `frontend-design`. *(depends on: 1.1)*

## 2. Integration verification

- [x] 2.1 Run `npm run build` and `npx vitest run` (green), then `npx playwright test e2e` with the stack up (green; default `es` visuals unchanged); run `openspec validate deepen-task-presentation --strict`. Skills: `code-review`. *(depends on: 1.2)*
