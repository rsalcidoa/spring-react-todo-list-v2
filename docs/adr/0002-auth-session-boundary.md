# One AuthSession owns the auth lifecycle

A single `AuthSession` module owns token storage keys, single-flight refresh and
rotation, and the 401 policy; `ApiService` is transport (its request
interceptor reads the token, its response interceptor delegates 401s) and
`AuthContext` is a thin React binding over `login`/`logout`/`subscribe`.
Previously three modules carried the lifecycle and disagreed on what counted as
a login call and on who persisted tokens.

Considered options: keeping the three modules and sharing a constant. The
refresh request deliberately goes through an injectable transport that defaults
to raw `axios` rather than the `api` instance, so the existing regression test
(which spies `axios.post`) keeps guarding refresh-and-retry; the *policy* is
still centralized in `AuthSession`.
