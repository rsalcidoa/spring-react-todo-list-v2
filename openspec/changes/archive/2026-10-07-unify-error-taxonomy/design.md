# Design

## Context

See `proposal.md` — Why. The envelope `{error, errors}` plus per-field details is the observable contract; the current handler is the only place it is knowable, and it is re-derived in the frontend.

## Goals / Non-Goals

**Goals:**
- One place maps a domain error to status + body; exceptions carry data only.
- Frontend mapper stays aligned; call sites stop inventing fallback text.

**Non-Goals:**
- Changing any error body (must stay byte-identical); localizing backend messages.

## Decisions

1. **`ErrorTaxonomy` with `kind → (status, envelope)`** (chosen); each exception is `(kind, field, message)`.
   - Alternative: keep per-exception handler methods — rejected: three-place edits, undiscoverable shape.
2. **Validation body owns the `tagNames[i] → tagNames` collapse** (chosen) as a rule of the `errors` map builder, not an ad-hoc helper.
   - Alternative: keep `normalizeField` — rejected: a body rule living outside the body builder.
3. **Stop mapping generic `IllegalArgumentException` to 400** (chosen): only the typed password-mismatch path keeps its contract; other throwers surface as 500.
   - Alternative: keep broad mapping — rejected: leaks internal messages.

## Seam and interface

```
enum ErrorKind { VALIDATION, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, INVALID_STATUS, ... }
record DomainException(ErrorKind kind, String field, String message)
ErrorTaxonomy.body(kind, field, message): (HttpStatus, Map)
```

## Risks / Trade-offs

- [Envelope drift] -> `ErrorContractIntegrationTest` asserts exact bodies; it is the guard.
- [Narrowing `IllegalArgumentException`] -> check each current thrower is intentional; convert them to typed exceptions.

## Test Strategy

- Backend: `ErrorContractIntegrationTest` stays green (exact bodies); add `ErrorTaxonomyTest` for the mapping table.
- Frontend: `TaskRepository.test.ts` mapping tests stay green.
