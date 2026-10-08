# Tasks

> Skills: `tdd`; `codebase-design`.

## 1. Contract suite

- [ ] 1.1 (red) `taskRepository.contract.test.ts`: the same cases (tag trim/CI, one-level subtasks, missing-id rejects, page semantics) over both adapters; verify it fails where they diverge.
- [ ] 1.2 Align `InMemoryTaskRepository` with the backend rules so the shared suite passes for both; verify `npx vitest run src/__tests__/taskRepository.contract.test.ts` green. Skills: `tdd`.

## 2. Narrow the port

- [ ] 2.1 Split the interface into `TaskStore`/`TagStore`/`ProjectStore`/`SubtaskStore`/`OrderingStore` and update call sites; verify `npm run build`.
- [ ] 2.2 `npm test -- --run`; confirm green.
