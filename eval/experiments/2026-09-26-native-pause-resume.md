# Native desktop pause and same-process resume

Date: 26 September 2026. Observed S4/S7 lifecycle evidence on the existing Windows
development machine. This is a checked-model synthetic SRT test, not clean-machine
installation or bilingual language-quality evidence. Publication remains deferred.

## Command and setup

From Auralis, run `task desktop:e2e:native:translation:pause` with absolute
`AURALIS_TEST_LLAMA_SERVER` and `AURALIS_TEST_GGUF` pointing to the already
installed b10977-0ecb159c9 runtime and checked Hy-MT2 1.8B Q4_K_M file. The local
CUDA runtime directory was prepended to PATH. `AURALIS_NATIVE_E2E_MEDIA_READY=1`
used the previously prepared media tools; no model/runtime download was performed.

The test builds a native Tauri executable with its isolated frontend and temporary
application-data root. The manual test runtime has 2048 context tokens and requests
99 GPU layers; the managed default RAM cache is zero. Its frozen checked profile
changes only `target_segments_per_block` to one under the `native-e2e` feature,
so two cues form two blocks. Production profile settings are unchanged.

The first synthetic cue is a greeting, and the second is a longer project-authored
Chinese paragraph about preserving and translating files. The original lives in
the fixture directory; Auralis imports a separate managed copy. Earlier checks of
the desktop media workflow also execute within this temporary sandbox.

## Verified sequence

1. React/Tauri imports the source, waits for its ready original artifact and
   freezes one project translation/run linked across both SQLite files.
2. Auralis admits a checked managed model and schedules the first host job. The
   frontend waits for one durable checkpoint out of two and requests pause.
3. The frontend observes `paused`, a cleared pause flag, one saved block, the same
   active run and no selected result/output. It pauses at a test-only project-title
   barrier so the outer harness can inspect the durable state.
4. The harness verifies one cancelled, closed host job; one closed Translate
   attempt with the matching host ID; no result or publication; and no new managed
   model process remaining. It releases the barrier in its isolated database.
5. The same desktop resumes the same `run_id`, creating a distinct host job and
   second attempt. It processes the missing cue and publishes a ready separate
   output with `needs_review`.
6. Final checks require exactly one cancelled job and one completed job, two
   closed attempts with distinct host IDs, both checkpoints, and a ready selected
   result. Every field in the original checkpoint remains identical. The external
   and managed originals are byte-identical; output retains timing and has a
   separate artifact ID/path. Both source/output outbox finalizations are complete.
7. The native test sandbox and native frontend build are removed.

The successful observed run was `0cffcc33-09da-40dc-927b-cb9330368cfd`.
This test pauses after a saved checkpoint; it does not sample an active HTTP slot.
The [separate checked-model CLI probe](2026-09-26-request-cancellation.md) supplies
busy-slot interruption evidence for SRT and WebVTT. No worst-case desktop pause
latency or Russian adequacy score was measured.

## Failures and supporting checks

The first native attempt reached translation cancellation but its new checkpoint
label was missing from the test command's allowed list. It failed before resume.
Adding `translation-pause-acknowledged` to that feature-gated list fixed the harness;
the full repeated native task exited successfully. This did not require a product
command or weakening the production command validation.

The adapter's unanswered-response test initially read the integer `ended_at` as a
string and assumed `stop_reason` held an enum. The corrected test reads the actual
schema types; the adapter now records the useful `pause requested` reason for
cancellation. The run state remains the typed pause indicator.

From Auralis, the following checks passed:

- `task rs:resolve:translate` for the local submodule dependency graph.
- `task rs:test:translate`, including the unanswered-response cancellation test.
- `task rs:test:ports` and `task rs:test:application` for host lifecycle/recovery.
- `task rs:clippy`; its first sandboxed build could not access a prepared sidecar,
  and the same check passed with local tool access permitted.
- `task fe:typecheck`, `task fe:lint`, `task q:ipc-contract` and `task fe:build`.
  IPC's first sandboxed invocation failed to spawn Node's test worker; its repeat
  passed. Production delivery verification found 16 frontend files and no emitted
  native test code, model weights or evaluation data.
- `task docs:check` for the host documentation contract.

The host lockfile resolves Tokio 1.53.1 for the newly explicit transport dependency.

Final worker review found that a durable UI pause closed its host job as cancelled
but reported `ApplicationFailed` to the in-memory runtime when its cancellation
token remained unset. The worker now treats the typed executor cancellation as
`Cancelled` too, and does not log it as an application failure. A separate
`translation_scheduler_pause` regression schedules the actual managed worker
through a recording wrapper over the real JobManager, holds a mock loopback HTTP
response, and pauses through the application use case. It observes the attached
task completion, a cancelled host job, paused Translate state with a cleared flag,
the retained active run, no selected result and unchanged source. This is real
two-database/scheduler evidence with mock HTTP, not another real-model run.

The focused command is
`task rs:test:application -- --test translation_scheduler_pause --test translation_host_execution_failure`.
It covers both cancellation completion and ordinary model failure; formatting and
Clippy checks also apply to this correction. The earlier native run did not
observe the internal runtime completion classification.

Further simultaneous start/pause/resume/deletion interleavings, native WebVTT pause,
pre-attempt admission cancellation, clean installation and language gates remain
separate work. Existing process-kill tests cover their recorded crash boundaries.
