# Spec Delta

## ADDED Requirements

### Requirement: UI Localization
The system SHALL render user-facing strings through a central i18n layer with at least `es` (default) and `en` locales. A language selector SHALL let the user change locale; the choice SHALL persist in `localStorage` and SHALL default to the browser language when supported, falling back to `es`. Translation keys SHALL be typed so a missing key is a compile-time error. Dates and counts SHALL be formatted with `Intl`.

**ID**: REQ-FE-028
**Affected files**:
- `frontend/src/i18n/index.ts` — provider + `useT()` + typed `TranslationKey`
- `frontend/src/i18n/es.ts`, `frontend/src/i18n/en.ts` — locale dictionaries
- `frontend/src/App.tsx` — wrap the app in the provider
- `frontend/src/pages/*`, `frontend/src/components/*` — replace literals with `t(...)`

#### Scenario: Default language is Spanish
- **WHEN** the app loads with no stored preference and a non-supported browser language
- **THEN** the UI renders in Spanish

#### Scenario: Switch language
- **WHEN** the user selects English in the selector
- **THEN** the visible strings render in English immediately and the choice persists across reloads

#### Scenario: Missing key is a compile error
- **WHEN** a component uses a key absent from the dictionaries
- **THEN** TypeScript fails the build (no runtime "key not found")

#### Scenario: Dates and counts use Intl
- **WHEN** a due date or count is rendered
- **THEN** it is formatted per the active locale, not by string concatenation
