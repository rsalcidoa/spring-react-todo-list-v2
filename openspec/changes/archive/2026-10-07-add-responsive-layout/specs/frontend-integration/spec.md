# Spec Delta

## ADDED Requirements

### Requirement: Responsive Board Layout
The board SHALL remain usable from a 360px-wide viewport up to desktop. On narrow viewports the columns SHALL be reachable without horizontal page overflow (horizontal scroll within the board or stacking), the header controls SHALL wrap without overlap, and the task modal SHALL occupy the full viewport. Interactive targets (buttons, cards) SHALL be at least ~40px in their smallest dimension on touch viewports. Breakpoint values SHALL be documented as tokens in `styles/theme.css` and the `@media` literals SHALL match those tokens (CSS cannot use `var()` inside media queries).

**ID**: REQ-FE-026
**Affected files**:
- `frontend/src/styles/theme.css` — breakpoint tokens
- `frontend/src/pages/TodoListPage.module.css` — board + header responsive rules
- `frontend/src/components/KanbanColumn.module.css`, `AddTaskModal.module.css` — column + modal responsive rules
- `frontend/src/components/KanbanCard.module.css` — touch target sizing

#### Scenario: Board fits a phone width
- **WHEN** the app is viewed at 360px wide with several tasks
- **THEN** the columns are reachable (horizontal scroll within the board or stacked) and the page itself does not overflow horizontally

#### Scenario: Header controls wrap
- **WHEN** the viewport is narrow
- **THEN** the header controls wrap onto multiple rows instead of overlapping or clipping

#### Scenario: Modal is full-screen on mobile
- **WHEN** the task modal opens on a narrow viewport
- **THEN** it fills the viewport and its fields remain reachable

#### Scenario: Breakpoints come from tokens
- **WHEN** a component needs a breakpoint
- **THEN** the `@media` value matches the documented token in `styles/theme.css` (literals, since CSS media queries cannot use `var()`)
