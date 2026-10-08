# Tasks

> Skills: `tdd`.

## 1. Auto-switch on drag

- [x] 1.1 (red) `TodoListPage.test.tsx`: with a field sort active, a card remains draggable and dropping a card calls `reorder` and switches the sort control to `Manual`. Verify red.
- [x] 1.2 Keep drag enabled (remove `dragEnabled` / hint), and on drop call `reorder` then `setQuery({ sort: undefined, dir: undefined })`; drop the `board.sortDragHint` key. Verify `npx vitest run src/__tests__/TodoListPage.test.tsx src/__tests__/useBoard.test.ts` green.
- [x] 1.3 Remove the now-unused `.sortHint` CSS. 

## 2. Verify

- [x] 2.1 `npm test -- --run` and `npm run build`; confirm green.
