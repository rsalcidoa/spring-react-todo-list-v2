# Design

## Context

See `proposal.md` — Why. Strings live inline across pages/components; no i18n dependency exists in `package.json`. The project values small, verifiable changes, so i18n should not pull a framework unless it clearly pays off.

## Goals / Non-Goals

**Goals:**
- A typed, dependency-free translation mechanism with a small runtime.
- Incremental migration (phase by phase) without breaking the build in between.

**Non-Goals:**
- Backend message localization, server locale negotiation, RTL, plural rules beyond `Intl`.

## Decisions

1. **Zero-dependency i18n module** (chosen): a React context holding the active locale + a `t(key)` function, with `es.ts`/`en.ts` dictionaries and a `TranslationKey` union derived from `es`.
   - Rationale: the app's string set is small; a full framework (react-i18next/FormatJS) is unnecessary weight now.
   - Alternative: `react-i18next` — rejected for now; revisit if pluralization/interpolation complexity grows.
2. **Default `es`, browser-detect on first run, persist in `localStorage`** (chosen).
   - Rationale: matches the current Spanish-first product while allowing English.
3. **Typed keys via `keyof typeof es`** (chosen) so missing keys fail `npm run build`.
   - Alternative: plain string keys — rejected: silent runtime misses.
4. **Frontend mapping for API errors** (chosen): map HTTP status/known codes to localized messages, keeping the backend message as fallback detail.
   - Alternative: localize backend messages — out of scope (would need stable error codes end to end).

## Migration phases

```
Phase 1: i18n infra (context, dictionaries, provider, selector, tests)
Phase 2: auth pages (Login, Register, ForgotPassword, ResetPassword)
Phase 3: board + card + column + filters
Phase 4: modal + ErrorBanner + API error mapping
```

Each phase ends with `npm run build` green (no mixed literals required to compile).

## Risks / Trade-offs

- [A key exists in `es` but not `en`] -> `en` is typed as `Partial<Record<TranslationKey, string>>` with fallback to `es`; the build still catches keys missing from `es`.
- [Large diff across components] -> phased tasks; behavior is unchanged by construction (same rendered text under `es`).
- [Snapshot/visual baselines change if default text changes] -> keep `es` output identical to today so visual baselines hold.

## Test Strategy

- **Unit (frontend):** `i18n.test.ts` — lookup, fallback to `es`, unknown key handling, typed-key surface.
- **Component (frontend):** switching locale changes rendered text; provider default is `es`.
- **Build:** `npm run build` fails on a missing `es` key (typed keys).
- **E2E:** existing Spanish baselines remain valid; add one English smoke baseline.
