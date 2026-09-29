# Auralis executor model preflight persistence

Status: partial `CTX-02` host integration evidence, 29 September 2026.
Translate source is published `70f59994d2347b985dbe05d0ef3152fcc2fbe7da`.
The isolated Auralis branch `feat/real-tts-pilot` has local, unpushed commit
`20e12438fee8de388b8f57f2459178879cee41e9` with that submodule pin.

## Reproduction and fix

The embedded Auralis executor previously verified the llama.cpp server before
`begin_guarded_attempt` without a durable record of the verification. Its
host job could fail with zero Translate attempts and no model-verification
outcome in Translate SQLite. The new adapter uses the guarded run-level
`model_preflight` diagnostic before verification. It finishes with
`verified`, `not_required`, `failed`, `paused` or `stale`, leaving an interrupted
verification `pending`. A later pause takes precedence over a model error and
prevents a Translate inference attempt. Auralis project SQLite retains the
host job's existing terminal outcome.

The process regression uses a checked profile with a local server that
responds 503 to `/health`: the run stays requested, `failed/transient` is
stored, and no attempt, checkpoint or changed original appears. A related
control pauses a checked request while `/health` has incomplete body bytes:
the connection closes, `paused` is stored, and no attempt appears. An
experimental unchecked success records `not_required` rather than claiming a
verified model. The mock server and unchecked path provide no language or
hardware evidence.

## Checks

- `task rs:test:translate`: passed, including the three process boundaries.
- `task voice:stage:check`: passed; the selected-script private stage still
  revalidates and cleans stale output with the new Translate pin.
- `task rs:test:application`: passed, including startup and two-database
  recovery tests. Real model, clean installer and listener tests remain ignored
  or separate.
- `task rs:clippy`, `task rs:fmt`: passed.
- `task docs:check`: passed when Node test-worker spawning was permitted. The
  first sandbox run stopped at `spawn EPERM` before assertions.

This records verification inside the Auralis executor after a model lease is
acquired. Earlier managed-runtime acquisition still has no matching Translate
preflight record, and the diagnostic does not yet carry an explicit host-job
ID for historical joins. The branch is local because private Auralis push
awaits the user's specific authorization.
