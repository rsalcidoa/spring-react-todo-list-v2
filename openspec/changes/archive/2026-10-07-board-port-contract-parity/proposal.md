# Proposal

## Why

`frontend/src/data/TaskRepository.ts` exposes one 19-method port mixing tasks, tags, projects, subtasks, ordering and restore. Its two adapters are not behaviorally interchangeable: `InMemoryTaskRepository.createSubtask` enforces one-level nesting and the tag name rules, while `HttpTaskRepository.createSubtask` just delegates to `create` and relies on the backend. Tests validate semantics against the in-memory adapter, so production can diverge silently.

## What Changes

- Split the port into narrow role interfaces (`TaskStore`, `TagStore`, `ProjectStore`, `SubtaskStore`, `OrderingStore`) — or expose one `BoardGateway` with composite use-case methods (`addTaskWithTags`, `moveAndReorder`) so atomicity and validation live once.
- Add a shared **contract test suite** that both adapters must satisfy, so "the interface" means the same thing everywhere.
- Align the in-memory adapter's rules with the backend contract.

**Non-goals:** changing the wire format; removing the in-memory adapter (it is the test seam).

**Rollback plan:** revert to the single wide interface; behavior identical in production.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. Behavior-preserving refactor (test-facing); `skip_specs: true`.

## Impact

- **Frontend (TS):** `frontend/src/data/TaskRepository.ts` (interface + both adapters), `frontend/src/__tests__/TaskRepository.test.ts`, call sites in `TodoListPage`/`AddTaskModal`.
