# Design

## Context

Current state:
- `LoginPage` uses `styles.field` for error display (CSS has `.error` class unused)
- `RegisterPage` uses `alert()` dialogs for errors
- `TodoListPage` uses `console.error()` silently for API failures
- `AddTaskModal` has `.newTagRow` CSS class but no tag creation/deletion UI
- Status dropdown is always enabled in AddTaskModal (should be disabled on creation)

## Goals / Non-Goals

**Goals:**
- Create reusable ErrorBanner component as the single error display mechanism
- Add client-side email validation before form submission
- Add tag create/delete UI in AddTaskModal
- Fix status default to PENDING (disabled) on task creation

**Non-Goals:**
- No backend changes
- No password reset
- No tag search/filter
- No mobile responsiveness changes

## Decisions

### Decision 1: ErrorBanner as shared component
**Choice**: Floating toast in upper-right corner, auto-hide 5s, stackable.
**Alternatives considered**:
- Inline banner below form: simpler but clutters layout
- Alert dialog: already used, needs replacement
- Toast library (react-toastify): adds dependency for a simple component

**Rationale**: The ErrorBanner is simple enough to implement as a single component. Using CSS modules keeps styles scoped. Auto-hide provides non-intrusive UX. Stacking handles concurrent errors.

```
+---------------------------------------------+
| ErrorBanner (stacked)                         |
| ErrorBanner                                   |
|                                              |
|          +-------------+                       |
|          | Form Area   |                       |
|          +-------------+                       |
+---------------------------------------------+
                    Floating toast (fixed position)
```

### Decision 2: Email validation via regex
**Choice**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` for client-side validation.
**Alternatives considered**:
- HTML5 `type="email"`: already present, but allows `mail@mail`
- No validation: relies entirely on backend (poor UX)

**Rationale**: Regex provides immediate feedback. The pattern is simple, well-tested, and doesn't need a library. Backend validation still applies (`.email` in DTOs).

### Decision 3: Tag creation inline in modal
**Choice**: Input + "Create" button rendered above existing tags, calls `createTag()` via `ApiService`.
**Rationale**: Uses the existing `.newTagRow` CSS class (already defined). The `createTag()` endpoint already exists in `ApiService.ts`. Tag refresh via existing `loadTags()` call after task creation/update.

### Decision 4: Status disabled on creation
**Choice**: `disabled={editingTask === null}` on the status `<select>`.
**Rationale**: Minimal change — one conditional prop. The value defaults to `TaskStatus.PENDING` via the `useState` initialization, which already matches the spec requirement.

## Risks / Trade-offs

[Risk] ErrorBanner could create visual noise if errors are frequent → [Mitigation] Auto-hide 5s, stacking with max 3 visible
[Risk] Regex email validation is not RFC 5322 complete → [Mitigation] Acceptable for UX; backend has `@Email` Bean Validation
[Risk] Tag creation without a dedicated page could lead to tag pollution → [Mitigation] Names are trimmed, case-insensitive deduplicated; max 50 chars enforced by backend

## Migration Plan

1. Create `ErrorBanner` component and CSS module
2. Update `LoginPage.tsx` — replace `styles.field` with `styles.error`, add email validation
3. Update `RegisterPage.tsx` — replace `alert()` with ErrorBanner, add email validation
4. Update `AddTaskModal.tsx` — add tag input, delete buttons, status conditional disable
5. Update `AddTaskModal.module.css` — add styles for new tag input and delete button
6. Update `TodoListPage.tsx` — replace `console.error()` with ErrorBanner
7. Update tests: `ErrorBanner.test.tsx`, update `AddTaskModal.test.tsx`, update `TodoListPage.test.tsx`
8. Verify: `npm run build` (frontend), `npm run test` (Vitest)

## Open Questions

None identified.
