# Role-sized repository ports with a shared contract suite

The frontend's data port is split into role-sized interfaces (`TaskStore`,
`OrderingStore`, `TagStore`, `ProjectStore`, `SubtaskStore`) composed into
`TaskRepository`, so callers depend only on the capability they use. A single
contract suite runs the same cases against both the in-memory and HTTP
adapters.

The in-memory adapter is aligned to the backend contract: creating a Subtask
with a missing or nested parent is a validation error, not `not-found` (the
mismatch the shared suite originally caught). Considered options: one wide
interface, and separate per-adapter suites — the latter is how the two adapters
drifted.
