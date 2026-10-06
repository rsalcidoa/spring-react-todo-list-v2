# Design

## Context

See `proposal.md` — Why. `AddTaskModal` owns tag create/delete and talks to the backend through `TaskRepository`; `TodoListPage` owns the available-tags state and the `loadTags()` refresh. The ErrorBanner and repository error mapping already exist and are reused.

## Goals / Non-Goals

**Goals:**
- Blank tag names produce a user-visible ErrorBanner instead of a silent no-op.
- Successful tag deletion is followed by a source-of-truth refresh of the tags list.

**Non-Goals:**
- Changing backend tag validation or the repository interface.
- Moving `loadTags()` ownership into `AddTaskModal`.

## Decisions

1. **Let the backend validate blank names** (chosen).
   - Rationale: matches REQ-FE-013 exactly and keeps a single source of validation truth; the inline `maxLength={50}` still guards the common case.
   - Alternative: keep the early return and amend the spec — rejected because the user chose to align code to the spec.
2. **Optimistic removal + `loadTags()` reconciliation** (chosen).
   - Rationale: preserves instant UI feedback while guaranteeing the list reflects the backend (REQ-FE-014).
   - Alternative: `loadTags()` only — rejected: a visible delay before the pill disappears.

## Risks / Trade-offs

- [Blank submit now issues a network request] → acceptable; it returns fast with 400 and renders the banner.
- [Double state update on delete] → the optimistic filter and the subsequent refresh converge on the same list; guarded by tests.

## Test Strategy

- Component (Vitest + Testing Library): `AddTaskModal.test.tsx` asserts blank submit triggers the repository call and renders the ErrorBanner.
- Page (Vitest): `TodoListPage.test.tsx` asserts `repository.listTags` is invoked after a successful delete.
- Regression: `npm test -- --run` and `npm run build`.
