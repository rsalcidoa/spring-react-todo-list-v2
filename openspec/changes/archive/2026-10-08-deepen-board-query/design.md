# Design

## Context

See `proposal.md` — Why. `services/boardQuery.ts` owns `BoardQuery`,
`compareTasks` and `applyBoardQuery`; `services/boardInteraction.ts` also owns
`getDueState`/`filterByView`/`todayLocal`/`BoardView`; `pages/useBoard.ts`
defines `BoardFilters` and coerces it to `BoardQuery` inline. ADR-0005 names
`BoardQuery` as the single client-side answer.

## Goals / Non-Goals

**Goals:**
- One module answers "which Tasks and in what order" (selection + ordering + Due
  state), with a small interface.
- The UI→domain coercion is owned and tested there.
- Keep `boardInteraction` about interaction (pointer/keyboard) only.

**Non-Goals:**
- Changing any observable selection/ordering result.
- Making the server filter by project/view.

## Decisions

1. **Move `BoardView`, `DueState`, `todayLocal`, `getDueState`, `filterByView`
   into `boardQuery.ts`.** The query module owns Due state; `boardInteraction`
   keeps interaction.
   - Rationale: they are selection concerns used by `applyBoardQuery`; keeping
     them apart forced call sites to bounce between two modules.
   - Alternative: leave them in `boardInteraction` and import — rejected: keeps
     the split the review flagged.
2. **Add `boardQueryFrom(filters: BoardFilters): BoardQuery`** and move the
   `BoardFilters` type into `boardQuery.ts`.
   - Rationale: the coercion (`'' | 'none' | id-string` → `undefined | 'none' | number`)
     is domain knowledge, not page knowledge; one place to test.
   - Alternative: a `BoardQuery` class with a static `from` — rejected: a plain
     function is the smaller interface.
3. **`boardInteraction` no longer imports query concerns.** `KanbanCard` imports
   `getDueState` from `boardQuery`; `TodoListPage`/`useBoard` import `BoardView`
   from `boardQuery`.
4. **Keep the in-memory adapter's subset explicit.** It still applies only the
   server-supported fields (`q`, `priority`, `status`, `tagIds`, `sort`, `dir`);
   a comment states that Project/View are client-only, so the "drop" is
   intentional rather than silent.
5. **Correct ADR-0005** to say the server mirrors search/priority/tags and
   ordering, while Project scope and date Views are client-side.

## Risks / Trade-offs

- [Import churn across three modules] → TypeScript build catches stragglers; tests
  move with the functions.
- [Perceived behavior change] → none intended; the existing `boardQuery` and
  `boardInteraction` tests are preserved (moved) and must stay green.

## Migration Plan

Frontend-only. Build with `npm run build`. Rollback reverts the moves.

## Test Strategy

- **Unit (Vitest):** `boardQuery.test.ts` gains `boardQueryFrom` coercion cases and
  absorbs the Due-state/`filterByView` cases; `boardInteraction.test.ts` keeps the
  interaction cases.
- **Component (Vitest):** `useBoard.test.ts` and `TodoListPage.test.tsx` stay green
  through the new module.
- **E2E (Playwright):** unchanged selection/ordering; run the suite to confirm.
- **Backend:** none.
