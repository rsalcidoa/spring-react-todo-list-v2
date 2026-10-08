# Spec Delta

## MODIFIED Requirements

### Requirement: UI Localization
The system SHALL render every user-facing string through a central i18n layer with at least `es` (default) and `en` locales. This SHALL include the board chrome (column labels, header controls and their options, filter aria-labels and the delete confirmation), the task modal, and the authentication pages (login, register, forgot-password, reset-password). A language selector SHALL let the user change locale; the choice SHALL persist in `localStorage` and SHALL default to `es` when there is no stored preference (Spanish-first product). Translation keys SHALL be typed so a missing key is a compile-time error. Dates and counts SHALL be formatted with `Intl`.

**ID**: REQ-FE-028
**Affected files**:
- `frontend/src/i18n/index.tsx` — provider + `useT()` + typed `TranslationKey`
- `frontend/src/i18n/es.ts`, `frontend/src/i18n/en.ts` — locale dictionaries
- `frontend/src/App.tsx` — wrap the app in the provider
- `frontend/src/pages/*`, `frontend/src/components/*` — replace literals with `t(...)`

#### Scenario: Default language is Spanish
- **WHEN** the app loads with no stored preference
- **THEN** the UI renders in Spanish

#### Scenario: Switch language
- **WHEN** the user selects English in the selector
- **THEN** the visible strings render in English immediately and the choice persists across reloads

#### Scenario: Board chrome and auth pages are localized
- **WHEN** the locale is English
- **THEN** the column labels, header controls and their options, the delete confirmation, the task modal and the login/register/reset pages render in English

#### Scenario: Missing key is a compile error
- **WHEN** a component uses a key absent from the dictionaries
- **THEN** TypeScript fails the build (no runtime "key not found")

#### Scenario: Dates and counts use Intl
- **WHEN** a due date or count is rendered
- **THEN** it is formatted per the active locale, not by string concatenation
