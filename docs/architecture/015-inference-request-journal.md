# Durable v5 inference request journal

Status: incremental `CTX-02` implementation, 29 September 2026.

The CLI attaches a SQLite journal to the v5 llama.cpp provider after opening a
guarded run attempt. Each chat-completion request has a new UUID, the run attempt,
batch fingerprint, target segment and line, exact serialized HTTP JSON body and
SHA-256. The start row commits before network I/O. A failed start prevents the
HTTP call. The completion row retains the raw response bytes when received,
restored validated text when accepted, server token usage when present, elapsed
monotonic time, outcome and error. A failed completion prevents the provider from
returning a validated line or committing a checkpoint. Different retries keep
different rows; an exact repeated finish is idempotent. A crash can leave a
`pending` row, which is visible after reopening and does not imply acceptance.

Schema 7 adds only `inference_requests`; the source, run, checkpoint and result
tables retain their previous content and identities. Foreign keys link the row to
its run and attempt. The repository checks that the target line exists in the
frozen source mapping, rejects changed request IDs and verifies the stored body
hash on read. The journal uses its own SQLite connection, so checkpoint writes
remain in the existing store. Project deletion follows the existing foreign-key
cascade. Raw source, context and model text are sensitive project data and stay in
the local state database, outside the public report.

This slice records v5 chat-completion requests from the CLI. Model verification,
`/apply-template` and `/tokenize` preflight requests are not yet journaled. The
Auralis host worker is not yet wired to this sink. The journal's presence does not
establish translation quality, model resource bounds or whole-file recovery.
