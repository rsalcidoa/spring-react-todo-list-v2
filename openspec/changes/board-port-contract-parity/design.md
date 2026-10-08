# Design

## Context

See `proposal.md` — Why. Two adapters, one contract, but they disagree; tests only know the in-memory one. The deletion test says keep the in-memory adapter (it is the test seam) but make the interface mean one thing.

## Goals / Non-Goals

**Goals:**
- One contract both adapters satisfy; validation/atomicity decisions in one place.
- The port surface shrinks to role-sized interfaces.

**Non-Goals:**
- Changing the wire format or the backend; removing the in-memory adapter.

## Decisions

1. **Narrow role interfaces** (chosen) over one `BoardGateway`.
   - Rationale: callers depend only on what they use; the page needs tasks+query, the modal needs tags+subtasks.
   - Alternative: a single `BoardGateway` with composite use-cases — noted as a fallback if atomicity across stores is needed.
2. **A shared contract suite** parameterized over an adapter factory (chosen): the same behaviors asserted for both adapters.
   - Alternative: separate suites — rejected: that is how they drifted.
3. **Align the in-memory adapter to the backend rules** (chosen) — one-level subtasks, tag name rules, project ownership as far as it applies.

## Seam and interface

```
TaskStore:    fetchAll(query) · fetchPage(query,p,s) · create · update · move · reorder · remove · restore
TagStore:     listTags · createTag · deleteTag
ProjectStore: listProjects · createProject · renameProject · deleteProject
SubtaskStore: listSubtasks · createSubtask · removeSubtask
```

## Risks / Trade-offs

- [Many small interfaces] -> keep them cohesive (one file per role) and re-export from `TaskRepository` for callers.
- [Http contract tests need transport] -> drive `HttpTaskRepository` with a mocked `ApiService`; drive `InMemory` directly; assert identical outcomes.

## Test Strategy

- Contract: `taskRepository.contract.test.ts` runs the same cases against both adapters.
- Regression: `TaskRepository.test.ts`, `TodoListPage.test.tsx`, `AddTaskModal.test.tsx` stay green.
