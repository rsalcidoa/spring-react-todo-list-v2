# Tasks

## 1. Database Migration

- [x] 1.1 Create `V3__add_password_reset.sql` — ADD reset_token VARCHAR(255), reset_expires TIMESTAMP to users table — verify migration runs successfully with `mvn flyway:test`

## 2. Backend Model and DTOs

- [x] 2.1 Add `resetToken` and `resetExpires` fields to `User.java` — verify entity compiles with new getters/setters
- [x] 2.2 Create `ResetRequestDto.java` (email: @NotBlank @Email), `ResetVerifyDto.java` (token: @NotBlank), `PasswordChangeDto.java` (token: @NotBlank, newPassword: @NotBlank @Size(min=6), confirmPassword: @NotBlank) — verify DTOs compile with validation annotations

## 3. Backend Repository and Exceptions

- [x] 3.1 Add `findByResetToken(String token)` method to `UserRepository.java` — verify method compiles and returns Optional<User>
- [x] 3.2 Create `InvalidResetTokenException.java` (extends RuntimeException), `ResetTokenExpiredException.java` (extends RuntimeException) — verify exceptions compile

## 4. Backend Service Layer

- [x] 4.1 Add `requestReset(String email)` to `UserService.java` — generates 6-char alphanumeric token, stores with 1-hour expiry, returns token — verify unit test passes
- [x] 4.2 Add `verifyResetToken(String token)` to `UserService.java` — checks token exists, not expired, not consumed — verify unit test passes
- [x] 4.3 Add `changePasswordViaReset(String token, String newPassword)` to `UserService.java` — validates token, updates password hash, clears token — verify unit test passes

## 5. Backend Controller and Exception Handler

- [x] 5.1 Add `POST /v1/auth/reset-request` endpoint to `AuthController.java` — verify endpoint accepts valid email, returns token in response, silent for non-existent email
- [x] 5.2 Add `POST /v1/auth/reset-verify` endpoint to `AuthController.java` — verify endpoint validates token, returns 200 for valid, 401 for invalid/expired
- [x] 5.3 Add `PUT /v1/auth/reset-change` endpoint to `AuthController.java` — verify endpoint validates password match, updates password, clears token
- [x] 5.4 Update `GlobalExceptionHandler.java` — add mappings for InvalidResetTokenException (400), ResetTokenExpiredException (401) — verify error responses are correct

## 6. Frontend API Service

- [x] 6.1 Add `requestReset(email)`, `verifyResetToken(token)`, `changePasswordReset(token, newPassword)` to `ApiService.ts` — verify functions use shared api instance with correct endpoints

## 7. Frontend Forgot Password Page

- [x] 7.1 Create `ForgotPasswordPage.tsx` and `ForgotPasswordPage.module.css` — verify page renders email input, displays generated token, shows "Continue to reset" link
- [x] 7.2 Write Vitest unit test for `ForgotPasswordPage.test.tsx` — verify component renders, form submits, token displayed — verify `npm run test -- ForgotPasswordPage.test.tsx` passes

## 8. Frontend Reset Password Page

- [x] 8.1 Create `ResetPasswordPage.tsx` and `ResetPasswordPage.module.css` — verify page renders token (from URL), new password input, confirm password input, submit button
- [x] 8.2 Write Vitest unit test for `ResetPasswordPage.test.tsx` — verify token validation, password change flow, navigation to login on success — verify `npm run test -- ResetPasswordPage.test.tsx` passes

## 9. Frontend Routes and Links

- [x] 9.1 Add routes `/forgot-password` and `/reset/:token` to `App.tsx` — verify routes render correct pages
- [x] 9.2 Add "Forgot password?" link to `LoginPage.tsx` pointing to `/forgot-password` — verify link navigates correctly

## 10. Backend Integration Tests

- [x] 10.1 Write JUnit integration tests for `AuthControllerTest` — verify reset-request, reset-verify, reset-change endpoints with valid/invalid data — verify `mvn test -Dtest=AuthControllerTest` passes
- [x] 10.2 Write JUnit integration tests for `UserServiceTest` — verify requestReset, verifyResetToken, changePasswordViaReset — verify `mvn test -Dtest=UserServiceTest` passes

## 11. Build Verification

- [x] 11.1 Run `npm run build` in frontend directory — verify build succeeds
- [x] 11.2 Run full test suite `npm run test` — verify all frontend tests pass
- [x] 11.3 Run `mvn test` in backend directory — verify all backend tests pass
