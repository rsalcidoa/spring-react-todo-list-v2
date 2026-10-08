# ErrorTaxonomy is the single error contract

`ErrorTaxonomy` maps a domain error kind to its HTTP status and response body:
`{error}` for simple errors and `{error, errors}` for validation, with
`tagNames[i]` element paths collapsed to the stable `tagNames` key. Exceptions
carry data only (`DomainException`), and `GlobalExceptionHandler` is a thin
adapter over the taxonomy.

Deliberate deviation: generic `IllegalArgumentException` is no longer mapped to
400. The one intentional thrower (password mismatch) became a typed error, so
unexpected programming errors surface as 500 instead of leaking their message.
Consequence: the observable bodies are byte-identical to before, guarded by the
error-contract integration test.
