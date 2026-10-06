# Proposal

## Why

After aligning the implementation with the specs, one stale wording remains: `frontend-integration`'s "User Views Task List" scenario says the system displays tasks in a "scrollable list", while the same requirement mandates — and the app renders — a status-grouped Kanban board. The contradiction makes the scenario ambiguous as a test contract.

## What Changes

- Update the "User Views Task List" scenario wording to describe the status-grouped Kanban board instead of a "scrollable list". No behavior changes; the requirement text and all other scenarios are unchanged.

**Non-goals:**
- No implementation change.
- No change to any other requirement or capability.

**Rollback plan:** revert the delta; the wording returns to its previous form.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `frontend-integration`: the "Task List View" requirement's "User Views Task List" scenario wording is corrected to match the mandated Kanban board.

## Impact

- **Specs:** `openspec/specs/frontend-integration/spec.md` (after archive).
- **Code/runtime:** none.
