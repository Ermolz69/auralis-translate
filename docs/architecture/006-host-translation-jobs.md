# Host translation jobs

Status: implementation design, 25 September 2026. Auralis creates durable Translate runs. A managed desktop command can now admit one checked model profile, own a local llama.cpp child process, execute a linked host job, and stage the validated output for artifact finalization. Translate records the host job ID on the attempt. The `Translation` job kind persists independently of dubbing project processing state. Auralis SQLite schema v8 and its storage port create, start, report progress for, and terminalize associated jobs with revision checks. An application-level checked-model worker-kill test covers child cleanup and resume; a [native Tauri checked-model test](../../eval/experiments/2026-09-25-native-tauri-translation.md) covers the desktop command and ready publication; a [native desktop crash/restart test](../../eval/experiments/2026-09-25-native-tauri-crash.md) covers retained checkpoint recovery and a second checked-model attempt. Installation and scheduler attachment remain open.

## Ownership and identity

One Auralis project may have several translations. A translation has one active `run_id` and may retain an earlier selected `result_id`. A **run** freezes the source digest, format grammar, parser policy, model profile, and block plan. Each attempt to work on that run gets a new Auralis `job_id`; the same ID enters Translate `run_attempts.host_job_id`. A pause or failed attempt leaves the run and committed checkpoints in place. Resume creates a new host job for the same run. Starting a different model/profile creates a new run under the same translation link.

Auralis owns the job record, run-to-job association, process/runtime lease, cancellation signal, and managed output artifact. Translate SQLite owns attempt state, checkpoints, warnings, and immutable result revisions. No full source or translated lines are copied into Auralis SQLite. Auralis's existing dubbing project status and active dubbing job remain separate from translation job status.

The existing Auralis `jobs` table and job queue accept a `translation` kind; a storage test confirms that such a job does not alter project processing state. The current `DubbingPipelineStage` field must become a typed kind-specific stage or remain absent for a translation job until that migration is complete; a translation job must never store a fake dubbing stage. Auralis SQLite schema v8 adds `translation_host_jobs(job_id, run_id, created_at, ended_at)`. `run_id` references the frozen intent, which already identifies `translation_id`; `job_id` references the host job. A partial unique index permits only one association with no `ended_at` per run and retains terminal history. The v7-to-v8 migration preserves frozen intents and project links. `SqliteTranslationHostJobStore` creates the pending job and association in one transaction only when the run is active for the job's project, and finishes the job and association in one transaction with optimistic revision checking. The schema alone does not enforce matching job kind or project; all production callers must use this storage port. `StartTranslationJobUseCase` provides the application boundary and returns an existing active job on a repeated start. The desktop managed-start command now invokes the worker directly; a detached scheduler remains open.

## Start and execution order

```mermaid
sequenceDiagram
    participant UI as Auralis UI
    participant Host as Auralis application
    participant Main as Auralis SQLite
    participant Work as Host job runner
    participant DB as Translate SQLite
    participant Model as Managed llama.cpp runtime
    UI->>Host: Start or resume translation
    Host->>Main: Verify project/source; freeze link and run intent
    Host->>DB: Idempotently register source map and block plan
    Host->>Work: Reserve model slot and start checked local runtime
    Host->>Main: Commit translation job and run association
    Work->>DB: Open attempt with host job ID
    Work->>Model: Use the verified runtime lease
    loop Missing blocks
        Work->>Model: Translate bounded block
        Work->>DB: Validate and commit checkpoint
        Work->>Main: Report committed progress
    end
    Work->>DB: Validate structure and commit result
    Work->>Main: Mark job complete
    Host->>Main: Stage separate output and publication outbox
    Main-->>UI: Ready result or needs-review result
```

All resource admission and job creation must have explicit compensation. A committed Auralis link/run intent survives failure to create Translate records. A job must not become `running` unless a worker is attached or startup recovery can identify and terminalize it. A worker must never report a block saved before the Translate checkpoint transaction commits. The result ID is available only after complete structural validation and Translate result commit.

The caller-driven worker receives core `RunProgress` after each durable checkpoint and mirrors its saved/total block counts into the linked running Auralis job. The initial count also includes checkpoints retained from an earlier attempt. The domain requires a fixed positive total and monotonic saved count; Auralis SQLite checks the active run association and job revision on every progress write. The host percentage stays below 100 until the validated result commits and the job completes. A failed mirror write is logged without changing the Translate run or discarding its checkpoint; Translate SQLite remains authoritative, so the host display can lag. Startup recovery rereads committed counts from Translate and persists them before closing a running host job. If the counts conflict with the host's monotonic state, recovery leaves the association active for attention. A storage-backed application test covers a lagging host count after result commit; a real desktop kill/restart test remains open. Progress is not yet streamed to the desktop UI.

`RunManagedTranslationUseCase` checks project/run ownership and Translate phase, acquires `TranslationModelRuntimePort` before creating a host job, executes the host attempt using only its lease URL, releases the child process, then stages the verified result. A failed admission leaves no new job. `ManagedLlamaRuntime` allows one installation-wide active lease, requires a checked frozen profile, hashes the configured model file, starts a private loopback `llama-server` child, probes its reported identity and model path, and verifies the loaded file before the host job exists. Windows ownership uses a kill-on-drop Job Object; Unix currently uses kill-on-drop for the direct child. A dropped request releases the slot and child. Startup recovery then closes any interrupted host job from durable Translate state. The caller-supplied URL application API remains available for development tests and does not represent the managed desktop route.

The desktop config file is `translation-runtime.json` under the Auralis application data root. Its paths must be absolute and point to an explicitly installed executable and GGUF file. Without this file, the start command reports that the runtime is unavailable and creates no host job. The initial UI polls linked run status for committed block counts, allows start/resume and durable pause requests, and shows a pending pause separately from `paused`. It does not yet stream progress events. When the selected ready result changes, the run panel refreshes the comparison view. Successful inference stages a pending publication; Auralis selects it only after the outbox finalizes a ready artifact. Model installation, package signing, a real process kill/restart test, and a language-quality gate remain required before release.

## Pause, cancellation, and restart

Pause writes Translate's durable `pause_requested` flag. The worker checks it before and after each model block. The existing HTTP call can finish before the pause is acknowledged; the UI must show `pause_requested` separately from `paused`. The host job then ends, while the run stays resumable and the Auralis translation link remains active. An explicit cancel of the host attempt also requests a Translate pause before runtime teardown; deleting a translation or project is a separate destructive action.

At desktop startup, the application data-root lease establishes that the prior Auralis worker is gone. Reconcile frozen intents first. Then enumerate only active Auralis host-job associations and call `recover_interrupted_for_host(run_id, job_id)` for each running Translate attempt. Translate SQLite rejects a host ID that differs from its open attempt, including an independent CLI attempt with no host ID. After scoped recovery, read Translate's run phase and committed block count, mirror lagging progress on a running host job, and atomically terminalize the job and association while preserving every committed checkpoint. This sequence is wired into desktop bootstrap; an item with a mismatched or unavailable Translate run stays active and is logged for attention. A mock-based process-kill test covers lagging host progress and a new pending attempt. A [checked-model worker-kill test](../../eval/experiments/2026-09-25-managed-worker-crash.md) covers model-child cleanup and same-run resume. The native desktop crash/restart test confirms one committed block survives parent termination and is not replaced during a second checked-model attempt. Reconciliation and recovery must remain idempotent across both databases.

Publication is a separate transition. A job can finish with a validated result while output staging fails; the link then retains the run/result for retry. After host-job recovery, Auralis startup now scans active validated runs and stages a verified publication only when no publication exists for that run. An existing pending or edited publication is left in place; a failed publication remains visible for attention rather than being silently replaced. The outbox finalizes pending artifacts. The project selects `result_id` only after the translated copy reaches the ready managed-artifact state. A newer run does not erase the previous selected result. Quality warnings set `needs_review` on the attached result and remain available in Translate diagnostics.

## Remaining S7 verification before release

1. Exercise job creation, resource reservation, worker attachment, progress, terminalization, and publication with a mock local model server across the two real SQLite files. Current tests cover caller-driven execution, persisted checkpoint progress, resource rejection before job creation, and managed runtime preflight rejection before process start. An opt-in checked-model test covers the managed child, both real SQLite files, output finalization, and the immutable original. The separate native E2E covers desktop invocation of a one-cue translation.
2. The mock-based worker-subprocess test proves committed progress survives and a new host attempt can begin on the same run; the checked-model worker-kill test proves the managed child exits and the missing block completes. A [validated-result gap test](../../eval/experiments/2026-09-25-result-gap-recovery.md) kills a mock-model worker after Translate result commit, automatically stages the missing publication on restart, and finalizes it after a second database reopening. The native Tauri crash/restart test now verifies the committed-checkpoint boundary and Windows Job Object child cleanup; the result-commit gap has not yet been injected into a native desktop process.
3. Pause during an in-flight block and verify that the UI distinguishes pending pause from acknowledged pause, without losing a checkpoint or modifying the original.
4. Verify project deletion and cancellation cannot select a stale result or leak a runtime process. Test concurrent start/resume requests and one-active-job enforcement.
5. Repeat the end-to-end path with a checked local model and bilingual review before claiming a supported Chinese → Russian configuration. Japanese → Russian has a separate release gate.
