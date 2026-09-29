# Durable v5 inference request journal

Status: incremental `CTX-02` implementation, 29 September 2026. The
[real preflight probe](../../eval/experiments/2026-09-29-inference-preflight-p01-results.md)
checks the current schema-8 behavior; older schema-7 chat evidence remains
separate.

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

Schema 8 records v5 `/apply-template` and `/tokenize` calls for
each target line in the same open attempt. A request kind identifies the local
endpoint while `rendered_request` remains the exact HTTP JSON body. The record
retains raw bounded replies and a parsed-shape outcome, including rejected
tokenizer responses and HTTP failures. A journal write failure stops the next
network request or translation; preflight rows are never accepted subtitle
lines. Existing chat rows migrate with an explicit chat kind and unchanged
bytes. Model verification before the run attempt and Auralis host attempts
remain outside this journal. The journal's presence does not establish
translation quality, model resource bounds or whole-file recovery.

Schema 8 is forward-only: a schema-7 binary rejects an upgraded database.
Before any production rollout, preserve a restorable copy of the schema-7
database. A rollback restores that copy alongside the old executable; do not
silently drop preflight rows to make an upgraded database readable by old code.
