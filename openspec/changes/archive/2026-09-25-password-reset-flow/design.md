# Design

## Context

Current state:
- User model has only `id`, `email`, `password`, `createdAt` fields
- No password reset mechanism exists in backend or frontend
- Auth endpoints: `POST /v1/auth/register`, `POST /v1/auth/login`
- No email service available (no SMTP configured)
- Users with forgotten passwords have no recovery path

## Goals / Non-Goals

**Goals:**
- Provide password recovery without email delivery
- Token-based verification with manual code entry
- 1-hour token expiration
- Minimal backend changes to existing auth flow

**Non-Goals:**
- No email/SMS delivery (token displayed in response body)
- No password strength requirements beyond current 6-char minimum
- No change-password-for-logged-in-user (only reset via forgot)
- No rate limiting on reset endpoints
- No brute-force protection

## Decisions

### Decision 1: Manual token entry (no email delivery)
**Choice**: Token generated server-side, returned in API response body. User copies it and enters on reset page.
**Alternatives considered**:
- Email delivery with SMTP: requires infrastructure setup
- Password generation: would require email anyway
- No token: insecure, just let user change password

**Rationale**: The project has no SMTP configured and no indication of email infrastructure. Manual token entry avoids adding infrastructure dependencies while maintaining a functional recovery flow.

### Decision 2: 6-character alphanumeric token
**Choice**: 6 random alphanumeric characters (A-Z, 0-9), stored as plain text in `reset_token` column.
**Alternatives considered**:
- Longer token (16 chars): more secure but harder to type
- Numeric-only (6 digits): easier to type but fewer combinations
- UUID (36 chars): too long to manually enter

**Rationale**: 6 alphanumeric characters = ~320 billion combinations (36^6). The 1-hour TTL limits exposure window. This is a reasonable trade-off between usability and security for a non-email-delivered flow.

### Decision 3: Token consumption model
**Choice**: Token marked as consumed on successful verification but not cleared until password change succeeds. Expired tokens return 401.
**Rationale**: Allows the token to be "used once" — if the user navigates away before completing the password change, the token remains valid for retry. Once the password is changed, the token is cleared.

### Decision 4: Silent response for non-existent email
**Choice**: `POST /v1/auth/reset-request` returns 200 OK with `{"token": ""}` for non-existent emails.
**Rationale**: Prevents user enumeration (an attacker cannot determine if an email is registered). The frontend handles both cases identically (shows "code sent" message).

### Decision 5: Separate verify + change endpoints
**Choice**: Two separate endpoints (`POST /v1/auth/reset-verify`, `PUT /v1/auth/reset-change`) instead of a single step.
**Alternatives considered**:
- Single endpoint: user enters token and password in one call
- Two-step flow: verify first, then change

**Rationale**: Separate endpoints allow better UX — the frontend can verify the token immediately and provide instant feedback before the user submits the password change. This also enables the "expired token" error to be caught early.

## Architecture Diagram

```
FRONTEND                          BACKEND
┌──────────────┐              ┌──────────────────┐
│ LoginPage     │              │ AuthController    │
│   ├ Forgot   │──POST──►    │   ├ reset-request │
│   │ Password  │              │   ├ reset-verify  │
│   └ Reset    │──POST──►     │   └ reset-change  │
│               │              │                   │
│               │              │ UserService       │
│               │◄──GET────── │   ├ requestReset() │
│               │              │   ├ verifyToken() │
│               │              │   └ changePass()  │
│               │              │                   │
│               │              │ UserRepository    │
│               │◄──UPDATE── │   └ findByResetToken()│
└──────────────┘              └──────────────────┘
                                    │
                                    ▼
                              ┌─────────────┐
                              │ PostgreSQL   │
                              │ users table  │
                              │ + reset_token│
                              │ + reset_expires│
                              └─────────────┘
```

## Risks / Trade-offs

[Risk] Token stored in URL (`/reset/:token`) may be logged in browser history → [Mitigation] Token expires in 1 hour; accept as trade-off for no-email approach
[Risk] No rate limiting allows brute-force on tokens → [Mitigation] 36^6 combinations makes brute-force infeasible; add rate limiting as future improvement
[Risk] Token returned in API response body could be intercepted → [Mitigation] API requires JWT auth (interceptor); same token used for all subsequent operations
[Risk] User abandons flow mid-reset → [Mitigation] Token expires after 1 hour; user can request new one

## Migration Plan

1. **DB Migration**: Create `V3__add_password_reset.sql` — ADD reset_token, reset_expires to users table
2. **Model Update**: Add fields to `User.java`
3. **DTOs**: Create `ResetRequestDto`, `ResetVerifyDto`, `PasswordChangeDto`
4. **Repository**: Add `findByResetToken(String token)` to `UserRepository`
5. **Service**: Add `requestReset()`, `verifyResetToken()`, `changePasswordViaReset()` to `UserService`
6. **Exceptions**: Create `InvalidResetTokenException`, `ResetTokenExpiredException`
7. **Controller**: Add 3 endpoints to `AuthController`
8. **ExceptionHandler**: Add mappings for new exceptions
9. **Frontend Pages**: Create `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`
10. **Frontend API**: Add endpoints to `ApiService.ts`
11. **Frontend Routes**: Add routes to `App.tsx`
12. **Login Page**: Add "Forgot password?" link
13. **Tests**: JUnit for service/controller, Vitest for pages

## Open Questions

None identified.
