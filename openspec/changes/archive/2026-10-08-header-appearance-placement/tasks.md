# Tasks

> Skills: `tdd`; `frontend-design`.

## 1. Move the appearance controls

- [x] 1.1 (red) `TodoListPage.test.tsx`: the language and theme selectors are inside the actions group, not the filters group. Verify red.
- [x] 1.2 Move the language/theme selectors beneath the actions (right-aligned) and adjust the header CSS. Verify `npx vitest run src/__tests__/TodoListPage.test.tsx` green.

## 2. Verify

- [x] 2.1 `npm test -- --run` and `npm run build`; confirm green. Refresh the affected visual baselines with the stack up and review the diff.
