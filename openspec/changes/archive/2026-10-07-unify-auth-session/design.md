# Design

## Context

See `proposal.md` — Why. Two 401 policies and a bypassed client instance are the friction; the deletion test shows deleting `session` only moves storage+redirect into `ApiService` while `AuthContext` still duplicates persistence.

## Goals / Non-Goals

**Goals:**
- One interface answers "how does a session start, refresh and end".
- One 401 policy; one owner of storage keys; refresh goes through the instance.

**Non-Goals:**
- Token format changes; multi-device; logout-all.

## Decisions

1. **One `AuthSession` module** (chosen): owns keys, rotation, reuse handling and the 401 policy.
   - Alternative: keep three modules and share a constant — rejected: the policies still disagree.
2. **`ApiService` is transport** (chosen): request interceptor calls `ensureFreshToken`; response interceptor delegates 401 to `AuthSession`.
   - Alternative: keep refresh in `ApiService` — rejected: it would re-own policy.
3. **`AuthContext` is a thin binding** (chosen): subscribes to `AuthSession` for `user`/`token`.
   - Alternative: context owns login — rejected: duplicates persistence.

## Seam and interface

```
AuthSession: { login(email,password), logout(), ensureFreshToken(): Promise<string>,
               authorizedRequest(config), subscribe(listener): unsubscribe }
```

## Risks / Trade-offs

- [Refresh single-flight must survive the move] -> keep one in-flight promise inside `AuthSession`.
- [Tests reference `session.ts` helpers] -> keep them as thin wrappers or migrate tests.

## Test Strategy

- Unit: `AuthSession.test.ts` — storage, rotation, single-flight refresh, 401 policy (no network; injectable transport/storage).
- Regression: `session.test.ts`, `ApiService.test.ts`, `AuthContext.test.tsx` stay green.
