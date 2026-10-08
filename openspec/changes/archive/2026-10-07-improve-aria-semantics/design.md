# Design

## Context

See `proposal.md` — Why. Today the undo bar is a single `role="status"` element wrapping a button and is cleared by `setTimeout(..., 5000)` in `TodoListPage`. Loading uses a `role="status"` skeleton region. WAI-ARIA guidance: live regions should contain text, not controls.

## Goals / Non-Goals

**Goals:**
- Correct roles: text announcements are live; controls are not inside live regions.
- Operable, time-friendly undo for keyboard and screen-reader users.

**Non-Goals:**
- Full WCAG audit; changes to `ErrorBanner` (toast) or inline field-error roles.

## Decisions

1. **Split announcement from control** (chosen): a visually-hidden `<span role="status">` renders the message; the visible undo bar (with the button) is a normal element outside any live region.
   - Alternative: keep `role="status"` on the bar and add `aria-live="off"` to the button — rejected: fragile and still nests a control.
   - Alternative: `role="alertdialog"` — rejected: heavier than needed for a transient toast.
2. **Focus the undo button on appearance** (chosen), via a `ref` + effect, so keyboard users can act immediately.
   - Alternative: leave focus unchanged — rejected: the affordance is easily missed.
3. **Pause the dismiss timer while the undo button is focused** (chosen): clear the timeout on focus and restart it on blur.
   - Alternative: extend the timeout to N seconds — rejected: still arbitrary.
4. **`aria-busy="true"` on the board while loading** (chosen); keep the existing skeleton status label.

## Risks / Trade-offs

- [Moving focus on delete could surprise mouse users] -> focus only the newly shown button; `Esc`/activation dismisses; acceptable and standard for toast+undo.
- [Tests query `role="status"` for loading] -> keep the skeleton `role="status"` and add `aria-busy`; update the undo tests to the new structure.

## Test Strategy

- **Component (frontend):** deletion renders a non-interactive live region and a focusable undo button; focus lands on the button; the button is not removed while focused; the board has `aria-busy` while loading.
- **Regression:** full `npm test -- --run` and `npm run build` (typecheck).
