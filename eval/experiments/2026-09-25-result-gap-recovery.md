# Validated-result publication gap recovery

Date: 25 September 2026. This is a deterministic Auralis application integration test using a mock local model response, two real SQLite files, a killed worker subprocess, and two host database reopenings. It verifies recovery between Translate result commit and Auralis publication, and between pending publication and artifact finalization. It does not measure model quality or invoke the native Tauri UI.

## Invocation

From the Auralis repository root:

```sh
task rs:test:application -- --test translation_result_gap_recovery -- --nocapture
```

The command passed: 2 tests passed, elapsed test time 0.34 seconds after compilation. The child test is inert when the parent has not set its test-only environment variables.

## Observed sequence

1. Auralis stored a one-cue synthetic Chinese SRT as an original artifact and froze the matching Translate run.
2. A worker subprocess started a linked translation host job, used a local deterministic HTTP responder, and committed a validated Translate result. Before it could stage any Auralis publication, the parent killed the worker.
3. After reopening Auralis SQLite, the new publication recovery use case found the validated result and no publication for that run. It reconstructed and verified the output from the immutable source through Translate, then staged one pending artifact, publication record, and outbox action. A second recovery call did not create a duplicate. The project still had no selected result while the artifact was pending.
4. After another host database reopening, the outbox finalized the separate artifact and selected the stored result. A repeated outbox poll found no additional work. The external original still matched its initial bytes.

The startup sequence runs this recovery after frozen-run reconciliation and host-job recovery. It skips non-validated runs and any run with an existing publication, including a pending or edited result; the outbox continues pending finalization, while a failed publication needs attention. The test covers a completed host job at the kill point. A native whole-desktop crash at this exact gap, concurrent publication/edit races, failed-publication repair, and actual model-process ownership at this gap still need separate verification.
