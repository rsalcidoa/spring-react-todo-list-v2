# Proposal

## Why

The auth lifecycle is spread across three modules with two 401 policies. `ApiService` attaches tokens, silently refreshes and retries; `session` owns storage and a redirect policy; `AuthContext` independently logs in and persists both tokens. The refresh call uses a raw `axios.post` that bypasses the instance (`ApiService.ts:18`), and the two modules disagree on what counts as a login call (`url === '/auth/login'` vs `url.includes('/auth/login')`).

## What Changes

- Add an `AuthSession` deep module: `login`, `logout`, `ensureFreshToken`, `authorizedRequest`, `subscribe`.
- Move storage keys, refresh-token rotation/reuse handling and the single 401 policy into it.
- `ApiService` becomes transport that calls `ensureFreshToken`; `AuthContext` becomes a thin React binding. The rest of the app stops touching storage keys or `api` directly for auth.

**Non-goals:** changing the token contract or endpoints; social login; device management.

**Rollback plan:** revert to the current three-module split; no API change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. Behavior-preserving refactor; `skip_specs: true`.

## Impact

- **Frontend (TS):** `frontend/src/services/{ApiService,session}.ts`, `frontend/src/context/AuthContext.tsx`, new `frontend/src/services/AuthSession.ts`.
