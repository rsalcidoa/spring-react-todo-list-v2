# BoardQuery decides which tasks the board shows and in what order

`BoardQuery` owns selection (search, priority, tags, project, date view),
ordering and the Due-state rules, and a `boardQueryFrom(filters)` owns the
coercion from the UI filters. It is used by the in-memory adapter and by the
board controller for optimistic overlays. The server's `taskSpecification` +
`applyOrdering` mirror the search/priority/tags and ordering fields; Project
scope and date Views are computed client-side over the already-loaded tasks
(REQ-FE-019 / REQ-FE-037). Considered options: pushing every filter server-only
(optimistic overlays still need a local predicate) and leaving the filtering
split across the server spec, the in-memory adapter and the page (the split that
had drifted).

Consequences: the `dueDate` nulls-last and default-direction rules are documented
once, the UI→domain coercion is tested in one place, and server/client ordering
parity is locked by a shared fixture test (Java integration test and Vitest
asserting the same order).
