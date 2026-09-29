# REG-009 CLI and SQLite recovery fixture

Status: fixture engineering check for `CTX-02` and `EVAL-04`, 29 September
2026. This is not a real-model or translation-quality score. The product-path
test is `crates/auralis-translation-cli/tests/source_prefix_repair_cli.rs` and is
run by `task test:source-prefix-repair`.

The test copies the checked opt-in v6 manifest, replaces its model identity
with a hashed synthetic local file, and disables context and tokenizer
preflight for a two-cue fixture. A loopback server exposes the same health,
properties, model-list and chat endpoints as the checked CLI path. It returns
one missing-code Russian line and then a changed `DOC-43` code. The first cue
is checkpointed with `source_prefix_inserted`; the second is rejected. SQLite
records both raw HTTP answers and pre-insertion candidates. The failed run
has one checkpoint, no selected result and no published subtitle file.

After reopening SQLite, the test resumes with the exact `DOC-42` code. It
checks both checkpoints, one persisted review flag, three journaled chat
requests, original source bytes and preserved cue times in the completed SRT.
An offline second resume re-exports byte-identical output without contacting
the server. This verifies recovery and publication boundaries on a fixture;
the real 1,024-cue model run and its semantic failures remain separate.

Validation: `task test:source-prefix-repair` passed eight adapter cases, four
core diagnostic cases, one SQLite diagnostic-reopen case and the new CLI
failure/recovery case. The [81-request same-source real-model screen](2026-09-29-reg-009-live-prefix-repair-results.md)
measures narrow code preservation, but it projected the policy over archived
responses and did not run this full CLI/SQLite path on the real model.
