# Tasks

> Skills: `tdd`.

## 1. Backend

- [x] 1.1 (red) `ProjectApiIntegrationTest`: deleting a project that has tasks (and a subtask) removes them; unrelated tasks remain. Verify red.
- [x] 1.2 Delete the project's tasks in `ProjectService.delete` (subtasks via the `parent_id` cascade); verify the test green. Then `mvn test`.

## 2. Frontend

- [x] 2.1 (red) `useBoard.test.ts`: `deleteProject` removes the project's tasks from state. Verify red.
- [x] 2.2 Update `deleteProject` and the confirmation copy (`project.deleteConfirm`); verify green.

## 3. Verify

- [x] 3.1 `npm test -- --run` and `npm run build`; confirm green. Refresh the affected visual baselines.
