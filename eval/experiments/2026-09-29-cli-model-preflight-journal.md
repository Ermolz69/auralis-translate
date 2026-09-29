# CLI model preflight persistence

Status: partial `CTX-02` reliability evidence, 29 September 2026. Scope is the
standalone CLI's checked-server verification before a Translate run attempt.
The Auralis managed-runtime admission path is separate.

## Reproduction and contract

Before this change, a checked model-file hash mismatch stopped the CLI before
`begin_guarded_attempt`, leaving the run requested with no attempt, checkpoint
or run-level record of the failed verification. A pause during the server
readiness response similarly left no durable preflight record. The original
and output stayed unchanged, but the failure boundary could not be audited from
Translate SQLite after the process ended.

The CLI now starts a guarded `model_preflight/pending` diagnostic before model
verification. It records `verified` with model alias, runtime build, context and
elapsed time; `failed` with provider category/reason; or `paused`/`stale` when
the guard changes. Unchecked legacy profiles record `not_required`. A crash
leaves `pending`; it never implies an accepted model or checkpoint. The
existing `diagnostics` table avoids a database migration. Rows are scoped to
the run and removed with project-owned run cleanup.

## Checks and observed outcomes

- `task test:preparation` passed after the test harness closed its SQLite
  connection before removing the temporary Windows directory. Its first run
  failed on that file lock, not on a product assertion.
- The checked-profile process test observed a `verified` row containing the
  expected alias, build and 2,048-token context. Its mismatched-hash control
  observed a `failed/permanent` row, zero checkpoints, a requested run and no
  output.
- The CLI pause process test observed one, then two distinct `paused` rows
  across initial start and resume, while retaining zero attempts, results and
  output.
- The SQLite test reopened a pending row after interruption, rejected a wrong
  run, invalid detail and duplicate finalization, and confirmed that a newer
  pause invalidates an old guard without creating an attempt.
- `task fmt`, `task lint`, `task test` (full offline workspace),
  `task plan:check`, `task docs:check`, `task site:build` and
  `task site:check` passed. `task eval:regression:check` first stopped when the
  sandbox denied Node test-worker creation (`spawn EPERM`); the unchanged task
  passed when rerun with process-spawn permission. This is an execution
  environment limit, not a regression assertion.

These fixture checks establish durable local failure records and pause
precedence. They do not verify model output, Chinese-to-Russian quality,
Auralis host admission, clean installation or a completed long file. The new
run-level rows are inspectable in Translate SQLite; the CLI `diagnostics`
command still reports checkpoint language warnings rather than these rows.
