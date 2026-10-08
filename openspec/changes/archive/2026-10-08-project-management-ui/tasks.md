# Tasks

> Skills: `tdd`; `frontend-design`.

## 1. Data plumbing

- [x] 1.1 Add `description` to the `Project` type, `ProjectStore`, `ApiService.createProject/renameProject` and `InMemoryTaskRepository`; update the contract suite. Verify `npx vitest run src/__tests__/taskRepository.contract.test.ts src/__tests__/TaskRepository.test.ts` green.
- [x] 1.2 `useBoard`: `createProject`, `renameProject`, `deleteProject` actions updating the projects list.

## 2. Manage dialog

- [x] 2.1 (red) `ManageProjectsModal.test.tsx`: create (name+description), edit, delete-with-confirm. Verify red.
- [x] 2.2 Implement `ManageProjectsModal` (+ CSS) and wire the entry points (empty-state "Create project" and "＋ New project…" in the selector). Verify the new test and `TodoListPage.test.tsx` green. Skills: `tdd`, `frontend-design`.

## 3. Verify

- [x] 3.1 `npm test -- --run` and `npm run build`; confirm green. Refresh the affected visual baselines.
