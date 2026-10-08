# BoardInteraction merges the shallow interaction helpers

Keyboard-to-status, drag-to-index, position math, focus restoration and
due-date presentation live in one `BoardInteraction` module; the former
micro-helpers (`boardKeyboard`, `taskOrdering`, `dueState`) were absorbed and
their tests moved to `boardInteraction.test.ts`. Considered options: leaving
the shallow helpers separate (their interfaces were nearly as complex as their
implementations).

Deliberate placement: date-view scoping (`filterByView`) went into the query
module (`BoardQuery`) rather than `BoardInteraction`, because "which tasks are
visible" is selection, not interaction.
