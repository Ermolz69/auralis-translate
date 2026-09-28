# V5 HTTP failure-body regression

Date: 29 September 2026. Backlog: `CTX-02`. This is a deterministic local HTTP
fixture check, not a real-model or language-quality measurement.

## Failure and contract

The v5 chat journal started a durable request before HTTP, but `LocalHttp`
returned on a non-2xx status before reading its body. A server diagnostic such
as `{"error":"model busy"}` therefore left `raw_response` empty even though the
server had sent bytes. This prevented later review of that attempted request.

The adapter now reads a response body up to the profile's existing
`max_response_bytes` limit before classifying HTTP status. A complete 503 body
is retained with a transient failure; a complete 400 body is retained with a
permanent failure. An oversized 503 body is rejected permanently and only its
bounded prefix is retained. The existing 200 malformed-candidate control still
retains raw bytes. The selected subtitle is never changed by an HTTP error.

## Verification

`task test:inference-journal` passed: 2 SQLite repository tests, 7 migration
tests, and 10 v5 provider tests. The new provider controls assert the exact
raw body, request/finish identity, outcome, retryability and absence of a
restored candidate for 503/400. The oversized control asserts an eight-byte
prefix and permanent size failure. The SQLite repository controls separately
prove raw rejected responses survive reopen. These are fixture checks; no
real server, HTTP proxy or crash was used in this slice.

`task fmt` initially found formatting in the new tests; `task fmt:fix` corrected
it and `task fmt` passed. `task lint` initially rejected two `expect_err` calls;
after replacing them, `task lint` passed. `task test` passed the full offline
workspace suite. `task plan:check` passed with 49 backlog tasks;
`task docs:check` passed with 133 Markdown files; `task site:build` and
`task site:check` passed with all 420 earlier requests retained. These failures
and corrections are part of the change record, not evidence of a model run.

The journal still covers CLI v5 chat completions only. `/apply-template` and
`/tokenize` preflights, Auralis worker calls and partial bytes from a connection
lost during body streaming remain outside this evidence. The existing actor
number error and long-file/source-aware review remain open.
