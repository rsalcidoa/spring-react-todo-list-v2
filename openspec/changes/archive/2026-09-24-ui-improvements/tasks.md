# Tasks

## 1. ErrorBanner Component

- [x] 1.1 Create `ErrorBanner.tsx` component and `ErrorBanner.module.css` styles — verify component renders with message, auto-hides after 5s, and stacks vertically
- [x] 1.2 Write unit tests for ErrorBanner — verify `npm run test -- ErrorBanner.test.tsx` passes

## 2. Email Validation

- [x] 2.1 Add `validateEmail()` helper function using regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` — verify it returns `true` for valid emails and `false` for `mail@mail`, `notanemail`, empty strings
- [x] 2.2 Apply validation in `LoginPage.tsx` — verify submission is blocked for invalid email and ErrorBanner displays error message

## 3. Error Display Fixes

- [x] 3.1 Fix `LoginPage.tsx` — change `styles.field` to `styles.error` for error display — verify error text appears in red using `--color-danger`
- [x] 3.2 Replace `alert()` calls in `RegisterPage.tsx` with ErrorBanner — verify error messages display as toast instead of browser alert
- [x] 3.3 Replace `console.error()` calls in `TodoListPage.tsx` with ErrorBanner — verify API errors show toast notification

## 4. Tag Management UI

- [x] 4.1 Add new tag input + "Create" button in `AddTaskModal.tsx` — verify input accepts tag names (1-50 chars) and calls `createTag()` from ApiService
- [x] 4.2 Add delete button (×) on each existing tag pill in `AddTaskModal.tsx` — verify clicking delete calls `deleteTag(id)` from ApiService
- [x] 4.3 Add styles for new tag input and delete button in `AddTaskModal.module.css` — verify visual styling matches existing tag pill style

## 5. Status Default PENDING

- [x] 5.1 Add `disabled={editingTask === null}` to status `<select>` in `AddTaskModal.tsx` — verify status is PENDING and disabled when creating, editable when editing

## 6. Update Tests

- [x] 6.1 Update `AddTaskModal.test.tsx` to cover new tag create/delete and status disabled behavior — verify `npm run test -- AddTaskModal.test.tsx` passes
- [x] 6.2 Update `TodoListPage.test.tsx` to verify ErrorBanner usage instead of console.error — verify `npm run test -- TodoListPage.test.tsx` passes

## 7. Build Verification

- [x] 7.1 Run `npm run build` in frontend directory — verify build succeeds with no errors or warnings
- [x] 7.2 Run full test suite `npm run test` — verify all tests pass
