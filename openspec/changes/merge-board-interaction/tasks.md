# Tasks

> Skills: `tdd`; `codebase-design`.

## 1. Merge

- [ ] 1.1 (red) `boardInteraction.test.ts` with the retired helper cases (keyboard target, position midpoint, drop index, due-state); verify red (module absent).
- [ ] 1.2 Implement `BoardInteraction` and route `KanbanColumn`/`KanbanCard`/page through it; delete the standalone helpers; verify `npx vitest run src/__tests__/boardInteraction.test.ts src/__tests__/TodoListPage.test.tsx` green. Skills: `tdd`, `codebase-design`.

## 2. Verify

- [ ] 2.1 `npm test -- --run` and `npm run build`; confirm green.
