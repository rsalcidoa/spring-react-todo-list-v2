# Tasks

> Skills: `tdd`.

## 1. Modal dropdown

- [x] 1.1 (red) `AddTaskModal.test.tsx`: the tag control is collapsed until opened; opening it lists tags; selecting shows a chip; the full list is not rendered at once. Verify red.
- [x] 1.2 Pass `collapsible` and `showChips` to the modal `TagSelect` and update the tag-related cases (open the dropdown, query by `option`/delete-button role). Verify `npx vitest run src/__tests__/AddTaskModal.test.tsx` green.

## 2. Verify

- [x] 2.1 `npm test -- --run` and `npm run build`; confirm green. Refresh the modal visual baselines.
