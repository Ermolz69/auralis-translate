# Auralis strict-WebVTT two-database path

Date: 25 September 2026. This is structural and lifecycle evidence for the documented plain-WebVTT subset. It does not establish real-model language quality, real-model WebVTT interruption/resume, native Tauri behavior, or support for general WebVTT syntax.

## Scenario

The Auralis application integration test `crates/application/tests/translation_vtt_publish.rs` uses a synthetic Chinese WebVTT input with CRLF line endings, a protected `NOTE` block, one cue with no external identifier, and a local mock HTTP response. It exercises the product use cases rather than calling the parser or renderer directly:

1. Import the external file as a pending original and finalize a managed, verified source copy through the Auralis outbox.
2. Begin a project-owned run, retaining its link in Auralis SQLite and its source map and attempt in Translate SQLite.
3. Start and complete a linked host job, record a validated `needs_review` Translate result, and read paired source/result lines through the project-scoped comparison use case.
4. Stage a separate output publication, confirm that no result is selected while the output is pending, then finalize it through the outbox and select its ready artifact.
5. Compare the output bytes against the expected WebVTT copy and verify that the managed and external originals remain byte-identical to the initial input. The `WEBVTT` header, `NOTE`, timing, CRLF separators, and terminal newline remain protected.

## Observed checks

In the Auralis checkout, `task rs:test:application` passed all application tests, including `webvtt_runs_through_both_databases_and_publishes_a_separate_verified_copy`. `task rs:fmt` and `task rs:clippy` also passed. The first compile attempt identified a missing trait import and an incompatible test error conversion; these were fixed before the passing run. The mock returns a fixed Russian word and cannot be used to infer translation quality.

This closes the earlier **SRT-only Auralis application integration-test gap** for one strict WebVTT file. It leaves wider format fixtures, native checked-model WebVTT, interruption and resume with a real model, subtitle consumer testing, corpus review, and S8/S9 release gates open.
