# Design

## Context

See `proposal.md` — Why. `JwtUtil` issues a 1h HS256 JWT; `AuthController.login` returns `LoginResponse(token)`; the frontend `session.ts` stores `jwt`/`email`, and the Axios response interceptor clears and redirects on 401. There is no server-side session state today.

## Goals / Non-Goals

**Goals:**
- Survive access-token expiry without a re-login, backed by server state only.
- Bound the blast radius of a leaked refresh token through rotation and reuse detection.

**Non-Goals:**
- Device/session listing, revoke-all endpoints, OAuth.

## Decisions

1. **Opaque refresh token, stored hashed (SHA-256), with a `refresh_tokens` table** (chosen).
   - Rationale: refresh tokens are stateful by nature; hashing avoids plaintext-at-rest; the table enables revocation and rotation.
   - Alternative: a second long-lived JWT — rejected: cannot be revoked.
2. **Rotation on every refresh + reuse detection** (chosen): each refresh revokes the used token and issues a new one; presenting a revoked token revokes the user's whole set.
   - Alternative: non-rotating refresh token — rejected: a leaked token is usable until expiry.
3. **A dedicated `TokenService`** (chosen) rather than growing `UserService` or `AuthController`.
   - Alternative: logic in the controller — rejected: violates the thin-controller rule.
4. **Client-side single-flight refresh + one retry** (chosen), owned by `ApiService`/`session`.
   - Alternative: refresh on a timer before expiry — rejected: clock-skew and background-tab issues; reactive refresh is simpler and sufficient.

## Refresh flow

```mermaid
sequenceDiagram
  participant App as ApiService
  participant S as session
  participant A as AuthController
  participant T as TokenService
  App->>A: request (expired access token) -> 401
  App->>S: getRefreshToken()
  App->>A: POST /v1/auth/refresh {refreshToken}   %% single-flight
  A->>T: refresh(raw)
  alt valid
    T->>T: verify hash, not expired/revoked
    T->>T: revoke old, insert new
    T-->>App: new token + refreshToken
    App->>S: save new pair
    App->>A: retry original request -> 200
  else invalid/revoked
    T-->>App: 401
    App->>S: clearSession(); redirect /login
  end
```

## Risks / Trade-offs

- [Refresh storm under many concurrent 401s] -> single-flight promise in `ApiService`; only one refresh in flight.
- [Race between rotation and retries] -> the retried requests use the new access token; if a rotation race still yields 401 once, the user is logged out (bounded).
- [Table growth] -> old revoked rows are small; a future change can add cleanup.
- [Migration on existing users] -> no refresh tokens exist yet; login issues the first one.

## Migration Plan

`V11__add_refresh_tokens.sql`:
```sql
CREATE TABLE refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL
);
```
Rollback drops the table.

## Test Strategy

- **Unit (backend):** `TokenServiceTest` — issues hashed tokens, rotates, rejects expired/revoked, reuse revokes the family.
- **Integration (backend, MockMvc + Postgres):** login returns both tokens; refresh returns a new pair; reused token -> 401 and family revoked.
- **Unit (frontend):** `session.test.ts` stores/clears both tokens; `ApiService` single-flight refresh retries once and logs out on failure.
