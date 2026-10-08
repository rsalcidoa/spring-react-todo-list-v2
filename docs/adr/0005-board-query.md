# BoardQuery decides which tasks the board shows and in what order

One `BoardQuery.apply(tasks, query)` answers selection (search, priority, tags,
project, date view) and ordering, and is used by the in-memory adapter and by
the board controller for optimistic overlays; the server's
`taskSpecification` + `applyOrdering` mirror the same fields. Considered
options: pushing every filter server-only (optimistic overlays still need a
local predicate) and leaving the filtering split across the server spec, the
in-memory adapter and the page (the split that had drifted).

Consequences: the `dueDate` nulls-last and default-direction rules are documented
once, and server/client ordering parity is locked by a shared fixture test
(Java integration test and Vitest asserting the same order).
