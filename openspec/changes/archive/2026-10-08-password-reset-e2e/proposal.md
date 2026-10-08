# Proposal — Prove the password-reset flow end to end

## Why

The reset flow exists but nothing exercises it against the running stack, so it
is hard to confirm it "really works" (the token is returned in the API response
and rendered on the forgot-password page, then used on `/reset/:token`).

## What Changes

- Add `frontend/e2e/password-reset.spec.ts`: register a user, request a reset,
  read the 6-character code from the page, open the reset link, set a new
  password, and log in with it.
- Add a short "Password reset" section to the README with the manual steps.

**Non-goals:** changing the reset endpoints or UI; email delivery (the token is
shown on screen in this app).

**Rollback plan:** delete the spec and the README section. Test/docs only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. Test-and-docs only (`skip_specs: true`).

## Impact

- **Frontend (E2E):** new `frontend/e2e/password-reset.spec.ts`.
- **Docs:** `README.md` (manual steps).
