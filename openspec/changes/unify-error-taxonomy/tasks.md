# Tasks

> Skills: `tdd`; `codebase-design`.

## 1. Taxonomy

- [ ] 1.1 (red) `ErrorTaxonomyTest`: each kind maps to the exact current status + body (validation with `tagNames[i]` collapse); verify red.
- [ ] 1.2 Implement `ErrorTaxonomy` + `DomainException`; make `GlobalExceptionHandler` a thin adapter; verify `mvn -Dtest=ErrorTaxonomyTest,ErrorContractIntegrationTest test` green. Skills: `tdd`.
- [ ] 1.3 Stop mapping generic `IllegalArgumentException` to 400 (convert throwers to typed exceptions); verify `mvn test`.

## 2. Frontend alignment

- [ ] 2.1 Align `mapApiError`/`toDisplayMessage` to the taxonomy and drop per-call-site fallback strings; verify `npx vitest run src/__tests__/TaskRepository.test.ts src/__tests__/AddTaskModal.test.tsx`.
- [ ] 2.2 `mvn test`, `npm test -- --run`, `npm run build`; confirm green.
