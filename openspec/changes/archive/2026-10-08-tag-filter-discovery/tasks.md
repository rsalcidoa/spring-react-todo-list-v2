# Tasks

> Skills: `tdd`; `frontend-design`.

## 1. Shared control

- [x] 1.1 (red) `TagSelect.test.tsx`: typing filters tags case-insensitively; selecting toggles a chip; clearing removes it; the full list is only bounded. Verify red.
- [x] 1.2 Implement `TagSelect` (+ CSS) with search, bounded list, selected chips and clear. Verify green. Skills: `tdd`, `frontend-design`.

## 2. Wire it up

- [x] 2.1 Replace the board tag pill row with the "Filter by tag" `TagSelect`; verify `npx vitest run src/__tests__/TodoListPage.test.tsx` green.
- [x] 2.2 Replace the modal tag pills with `TagSelect` (keeping create/delete); verify `npx vitest run src/__tests__/AddTaskModal.test.tsx src/__tests__/useTaskForm.test.ts` green.

## 3. Verify

- [x] 3.1 `npm test -- --run` and `npm run build`; confirm green. Refresh the affected visual baselines.
