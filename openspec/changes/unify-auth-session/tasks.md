# Tasks

> Skills: `tdd`; `codebase-design` for the seam.

## 1. Extract the session

- [ ] 1.1 (red) Write `AuthSession.test.ts` (injectable storage + transport) asserting: login persists both tokens, `ensureFreshToken` refreshes once under concurrency, and a non-login 401 clears + redirects; verify red (module absent).
- [ ] 1.2 Implement `AuthSession` moving storage/rotation/401 policy out of `ApiService`/`session`; verify `npx vitest run src/__tests__/AuthSession.test.ts` (green). Skills: `tdd`, `codebase-design`.
- [ ] 1.3 Make `ApiService` transport delegate to `AuthSession`, and `AuthContext` a thin binding; verify `npx vitest run src/__tests__/session.test.ts src/__tests__/ApiService.test.ts src/__tests__/AuthContext.test.tsx` stays green.

## 2. Verify

- [ ] 2.1 `npm test -- --run` and `npm run build`; confirm green.
