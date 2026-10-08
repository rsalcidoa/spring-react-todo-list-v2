# Design

## Context

See `proposal.md` — Why. `add-task-query` introduces a `TaskQuery` Specification for `GET /v1/tasks`. Pagination should ride the same query path and stay backward compatible (the array response must remain when params are omitted).

## Goals / Non-Goals

**Goals:**
- Bound payload/render cost while keeping the existing array contract.
- Compose with search/sort/filter and stay testable in the in-memory adapter.

**Non-Goals:**
- Cursor pagination, virtualization, changing the default response shape.

## Decisions

1. **Offset pagination (`page`/`size`) via Spring Data `Pageable`, activated only when the params are present** (chosen).
   - Rationale: simplest to add and to reason about; the array path stays untouched for compatibility.
   - Alternative: cursor-based — rejected: more complex and unnecessary at personal scale.
   - Alternative: always return the envelope — rejected: breaking change for existing clients.
2. **New `PageResponse<T>` envelope record** (chosen) with `items/page/size/total`.
   - Alternative: return Spring's `Page` JSON directly — rejected: unstable shape and leaks internals.
3. **Frontend "Cargar más"** (chosen) over infinite scroll.
   - Rationale: explicit, accessible, easy to test; fits the small-changes ethos.
   - Alternative: infinite scroll — rejected: harder to test and can hide the end state.
4. **Query change resets to page 0** (chosen) to avoid mixing pages from different queries.

## Response shape

```
GET /v1/tasks                         -> TaskResponse[]            (unchanged)
GET /v1/tasks?page=0&size=20&q=...    -> { items, page, size, total }
```

## Risks / Trade-offs

- [Clients that assume an array might send page params by accident] -> only the presence of both params switches shape; validation rejects bad values.
- [Offset pagination with concurrent edits can skip/duplicate] -> acceptable for a personal app; noted for a future cursor-based revision.
- [Interaction with manual ordering] -> pagination orders by the query sort; manual position ordering stays a client concern for appended pages.

## Migration Plan

No schema change. Rollback ignores the params and removes the UI.

## Test Strategy

- **Unit (backend):** service builds the right `Pageable`; invalid `page`/`size` -> structured 400.
- **Integration (backend, Postgres):** envelope with `total`; no-params array unchanged; composes with `q`/sort.
- **Unit/Component (frontend):** `fetchPage` semantics in both adapters; "Cargar más" appends; query change resets to page 0.
