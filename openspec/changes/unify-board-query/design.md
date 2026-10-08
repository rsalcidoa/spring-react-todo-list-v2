# Design

## Context

See `proposal.md` — Why. Filter/sort semantics are duplicated across the server spec, the in-memory adapter and the page; the deletion test shows removing any single one just moves logic into a caller.

## Goals / Non-Goals

**Goals:**
- One module answers "the board's visible tasks" for a given query.
- Server and client sort/view semantics agree.

**Non-Goals:**
- Changing the query params or page envelope; new filters.

## Decisions

1. **A `BoardQuery` value with `apply(tasks)`** (chosen) next to the existing `TaskQuery` wire shape; the server keeps a single equivalent (`taskSpecification` + `applyOrdering`).
   - Alternative: keep client filtering in the page — rejected: semantics drift.
   - Alternative: push every filter server-side only — rejected: optimistic overlays still need a local predicate; `apply` serves both.
2. **The page sends all filters and treats the page as canonical** (chosen): view/tag/project included in the query.
   - Alternative: hybrid — rejected as the current source of drift.
3. **Delete duplicate passes** (`boardView` fold-in, page filter/group passes) (chosen).

## Seam and interface

```
BoardQuery: { q?, priority?, tagIds?, projectId?, view?, sort?, dir? }
BoardQuery.apply(tasks): Task[]   // used by InMemory adapter + optimistic overlays
TaskQuery (server) mirrors the same fields; sort/view defaults documented once.
```

## Risks / Trade-offs

- [Server/client parity must be proven] -> shared fixture tests: the same query over the Java spec and over `apply` must yield the same order.
- [Page still needs grouping by status] -> grouping stays a view concern; only *selection/order* moves.

## Test Strategy

- Unit: `boardQuery.test.ts` (each filter + sort incl. dueDate nulls-last) and a Java equivalent.
- Parity: a table-driven test asserting identical ordering for the same query on both sides.
- Regression: `TaskQueryIntegrationTest`, `TodoListPage.test.tsx` stay green.
