# Tasks

> Skills: `tdd`; `codebase-design`.

## 1. The query module

- [ ] 1.1 (red) `boardQuery.test.ts`: search, priority, tagIds, projectId, view, sort (incl. dueDate nulls-last) over `apply(tasks)`; verify red.
- [ ] 1.2 Implement `BoardQuery.apply` and route `InMemoryTaskRepository.fetchAll` and the page's client filtering through it; verify `npx vitest run src/__tests__/boardQuery.test.ts` green. Skills: `tdd`.
- [ ] 1.3 Fold `boardView` view rules into `BoardQuery`; verify `npx vitest run src/__tests__/boardView.test.ts src/__tests__/TodoListPage.test.tsx`.

## 2. Parity + verify

- [ ] 2.1 Add a parity test comparing Java `taskSpecification`+`applyOrdering` order with `BoardQuery.apply` for the same query; verify `mvn -Dtest=TaskQueryIntegrationTest test` and `npm test -- --run`.
- [ ] 2.2 `mvn test`, `npm run build`; confirm green.
