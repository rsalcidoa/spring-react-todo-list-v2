# Tasks

Frontend refactor; no backend tasks and no behavior change (`skip_specs`). Each
task ends with a verification command. Run frontend commands from `frontend/`.

## 1. The board mutations module (frontend)

- [x] 1.1 (red) Add `frontend/src/__tests__/boardMutations.test.ts` covering `patchTask`/`replaceTask`/`removeTask`/`addTask` (identity, immutability) and `runOptimistic` (applies, awaits, rolls back and calls `onError` on rejection, does not roll back on success); run `npx vitest run src/__tests__/boardMutations.test.ts` (red). Skills: `tdd`. *(depends on: none)*
- [x] 1.2 Implement `frontend/src/services/boardMutations.ts` and refactor the `useBoard` actions (`move`, `reorder`, `save`, `deleteTask`, `undo`, `quickAdd`, `removeTag`) to use it; verify 1.1 passes (green). Skills: `frontend-design`. *(depends on: 1.1)*

## 2. Integration verification

- [x] 2.1 Run `npm run build` and `npx vitest run` (green), then `npx playwright test e2e` with the stack up (green); run `openspec validate extract-board-mutations --strict`. Skills: `code-review`. *(depends on: 1.2)*
