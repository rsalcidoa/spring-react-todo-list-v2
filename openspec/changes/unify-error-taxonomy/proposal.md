# Proposal

## Why

The error contract is defined three times: ~13 exception classes, 13 one-line handler methods in `GlobalExceptionHandler`, and the frontend `mapApiError`/`toDisplayMessage`, plus per-call-site fallback strings (e.g. `AddTaskModal.tsx`). Adding a domain error means editing all three, and the envelope shape (including the `tagNames[i]` normalization) is only discoverable by reading the handler. `handleIllegalArgument` also leaks generic programming-error messages.

## What Changes

- Introduce an error taxonomy: a domain `kind` → `(status, body)` mapping in one module; the exception classes reduce to data (kind + field + message).
- Make the `tagNames[i]` collapse a property of the validation body builder.
- Keep one frontend mapper aligned to the taxonomy; call sites stop inventing fallback text. Stop mapping generic `IllegalArgumentException` to a client 400.

**Non-goals:** changing the observable error bodies (they stay identical); i18n of backend messages.

**Rollback plan:** revert to the current handler + exceptions; behavior identical.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. Behavior-preserving refactor; `skip_specs: true`.

## Impact

- **Backend (Java):** `exception/GlobalExceptionHandler`, `exception/*.java`, new `exception/ErrorTaxonomy`.
- **Frontend (TS):** `frontend/src/data/TaskRepository.ts` (`mapApiError`/`toDisplayMessage`), call-site fallbacks.
