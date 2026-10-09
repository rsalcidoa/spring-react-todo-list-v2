# Tasks

Frontend refactor; no backend tasks and no behavior change (`skip_specs`). Each
task ends with a verification command. Run frontend commands from `frontend/`.

## 1. Deepen the query module (frontend)

- [x] 1.1 (red) Extend `frontend/src/__tests__/boardQuery.test.ts` with `boardQueryFrom` coercion cases (`'' → undefined`, `'none' → 'none'`, an id string → number; passthrough of view/tag/query) and move the Due-state / `filterByView` / `todayLocal` cases from `frontend/src/__tests__/boardInteraction.test.ts`; run `npx vitest run src/__tests__/boardQuery.test.ts src/__tests__/boardInteraction.test.ts` (red). Skills: `tdd`. *(depends on: none)*
- [x] 1.2 Move `BoardView`, `DueState`, `todayLocal`, `getDueState`, `filterByView` and the `BoardFilters` type into `frontend/src/services/boardQuery.ts`, add `boardQueryFrom(filters: BoardFilters)`, and slim `frontend/src/services/boardInteraction.ts` to interaction only; update imports in `frontend/src/pages/useBoard.ts`, `frontend/src/components/KanbanCard.tsx` and `frontend/src/pages/TodoListPage.tsx`; verify 1.1 passes (green). Skills: `frontend-design`. *(depends on: 1.1)*

## 2. Documentation and integration verification

- [x] 2.1 Correct `docs/adr/0005-board-query.md` (server mirrors search/priority/tags and ordering; Project scope and date Views are client-side) and add the clarifying comment in the in-memory adapter's query subset. *(depends on: 1.2)*
- [x] 2.2 Run `npm run build` and `npx vitest run` (green), then `npx playwright test e2e` with the stack up (green); run `openspec validate deepen-board-query --strict`. Skills: `code-review`. *(depends on: 2.1)*
