# Design

## Context

See `proposal.md` — Why. The suite runs on JUnit5 + MockMvc for backend integration, Vitest + Testing Library for frontend, and Playwright for E2E. Backend integration tests need Postgres (docker-compose). Existing helpers (register/login flows, InMemory repository, mocked `api`) are reused.

## Goals / Non-Goals

**Goals:**
- Every scenario listed in the verification report has at least one asserting test.
- Tests assert observable contract values (exact bodies, fields, navigation), not only status codes.

**Non-Goals:**
- Raising line coverage for its own sake.
- Load/concurrency stress beyond the existing concurrency tests.

## Decisions

1. **Assert contracts, not just status codes** (chosen).
   - Rationale: the verification found tests that passed while the body diverged (e.g. null-body PATCH). Exact assertions prevent that.
   - Alternative: snapshot endpoints — rejected as brittle and not per-scenario.
2. **Place backend coverage in existing integration classes** (chosen) rather than new classes, to mirror the spec grouping.
3. **Fix the E2E locator to Spanish** and assert the created tag, so the test name matches what it verifies.

## Risks / Trade-offs

- [Integration tests depend on a running Postgres] → documented command keeps docker-compose up before `mvn test`.
- [Concurrent task-tag test could be flaky] → keep it optional/sequential-friendly, or mark clearly.

## Test Strategy

- Backend: integration (MockMvc, exact JSON) + service unit where the module owns the decision.
- Frontend: component tests with mocked `TaskRepository`/`api`; assert visible text, banner role, and navigation spies.
- E2E: one Playwright flow against the running stack.
