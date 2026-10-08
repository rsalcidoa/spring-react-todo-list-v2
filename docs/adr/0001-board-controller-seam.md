# Board state and mutation policy live in useBoard

The board's read state (tasks, tags, projects, filters, loading, error) and all
optimistic mutation policy — snapshot, patch, await the repository, roll back on
failure — plus the undo lifecycle, query debounce and pagination live in one
`useBoard` hook; `TodoListPage` is a view over its interface. Considered
options: keeping the handlers inline in the page (the defect surface was the
call sequencing, not any single helper) and a global store (unnecessary for a
single board). Consequence: rollback and undo have one locality, and the board
is testable through the hook instead of the DOM.
