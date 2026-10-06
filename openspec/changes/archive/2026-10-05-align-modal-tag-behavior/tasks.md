# Tasks

## 1. Align tag creation

- [x] 1.1 In `AddTaskModal.handleCreateTag`, remove the `if (!name) return;` early exit so blank names reach the repository; verify `npm test -- --run -- AddTaskModal` passes after task 1.2.
- [x] 1.2 Update `AddTaskModal.test.tsx` blank-tag test to assert the repository is called and the ErrorBanner shows the validation message; verify `npm test -- --run -- AddTaskModal`.

## 2. Align tag deletion refresh

- [x] 2.1 In `TodoListPage`, call `loadTags()` inside `onTagDeleted` after the optimistic update (depends on nothing); verify `npm test -- --run -- TodoListPage` after task 2.2.
- [x] 2.2 Update `TodoListPage.test.tsx` to assert `repository.listTags` is called after a successful tag delete; verify `npm test -- --run -- TodoListPage`.

## 3. Verify

- [x] 3.1 Run the full frontend suite `npm test -- --run` and the production build `npm run build`; confirm both succeed (depends on 1.1, 1.2, 2.1, 2.2).
