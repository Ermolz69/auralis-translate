# Host translation jobs

Status: implementation design, 25 September 2026. Auralis creates durable Translate runs, and an experimental caller-driven worker can execute one through a linked host job using a supplied local-server URL. Translate records that job ID on the attempt. The `Translation` job kind persists independently of dubbing project processing state. Auralis SQLite schema v8 and its storage port create, start, and terminalize associated jobs with revision checks. Desktop scheduling, managed model process ownership, and checkpoint progress reporting are not implemented yet.

## Ownership and identity

One Auralis project may have several translations. A translation has one active `run_id` and may retain an earlier selected `result_id`. A **run** freezes the source digest, format grammar, parser policy, model profile, and block plan. Each attempt to work on that run gets a new Auralis `job_id`; the same ID enters Translate `run_attempts.host_job_id`. A pause or failed attempt leaves the run and committed checkpoints in place. Resume creates a new host job for the same run. Starting a different model/profile creates a new run under the same translation link.

Auralis owns the job record, run-to-job association, process/runtime lease, cancellation signal, and managed output artifact. Translate SQLite owns attempt state, checkpoints, warnings, and immutable result revisions. No full source or translated lines are copied into Auralis SQLite. Auralis's existing dubbing project status and active dubbing job remain separate from translation job status.

The existing Auralis `jobs` table and job queue accept a `translation` kind; a storage test confirms that such a job does not alter project processing state. The current `DubbingPipelineStage` field must become a typed kind-specific stage or remain absent for a translation job until that migration is complete; a translation job must never store a fake dubbing stage. Auralis SQLite schema v8 adds `translation_host_jobs(job_id, run_id, created_at, ended_at)`. `run_id` references the frozen intent, which already identifies `translation_id`; `job_id` references the host job. A partial unique index permits only one association with no `ended_at` per run and retains terminal history. The v7-to-v8 migration preserves frozen intents and project links. `SqliteTranslationHostJobStore` creates the pending job and association in one transaction only when the run is active for the job's project, and finishes the job and association in one transaction with optimistic revision checking. The schema alone does not enforce matching job kind or project; all production callers must use this storage port. `StartTranslationJobUseCase` provides the application boundary and returns an existing active job on a repeated start. It is not yet connected to desktop scheduling or a worker.

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
    Host->>Main: Commit translation job and run association
    Host->>Work: Reserve resource lease and attach task
    Work->>DB: Open attempt with host job ID
    Work->>Model: Check runtime and model identity
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

The first production runner should accept a checked, frozen model profile. It must own or verify the local server process, loaded model, model-file digest, and resource slot before inference. The current application API accepts a caller-supplied loopback URL for development and is not the managed runner. An unchecked experimental profile cannot silently enter the production path.

## Pause, cancellation, and restart

Pause writes Translate's durable `pause_requested` flag. The worker checks it before and after each model block. The existing HTTP call can finish before the pause is acknowledged; the UI must show `pause_requested` separately from `paused`. The host job then ends, while the run stays resumable and the Auralis translation link remains active. An explicit cancel of the host attempt also requests a Translate pause before runtime teardown; deleting a translation or project is a separate destructive action.

At desktop startup, the application data-root lease establishes that the prior Auralis worker is gone. Reconcile frozen intents first. Then enumerate only active Auralis host-job associations and call `recover_interrupted_for_host(run_id, job_id)` for each running Translate attempt. Translate SQLite rejects a host ID that differs from its open attempt, including an independent CLI attempt with no host ID. After scoped recovery, atomically terminalize the host job and its association while preserving every committed checkpoint. This sequence is wired into desktop bootstrap; an item with a mismatched or unavailable Translate run stays active and is logged for attention. Storage, application, and adapter tests cover the individual boundaries; a real desktop kill/restart test is still required. Reconciliation and recovery must be idempotent after a crash between the two databases.

Publication is a separate transition. A job can finish with a validated result while output staging fails; the link then retains the run/result for retry. The project selects `result_id` only after the translated copy reaches the ready managed-artifact state. A newer run does not erase the previous selected result. Quality warnings set `needs_review` on the attached result and remain available in Translate diagnostics.

## S7 verification before enabling the UI action

1. Exercise job creation, resource reservation, worker attachment, progress, terminalization, and publication with a mock local model server across the two real SQLite files.
2. Kill the worker after a committed block, restart desktop services, and prove the same run resumes only missing blocks. Repeat after the result commit and before managed output finalization.
3. Pause during an in-flight block and verify that the UI distinguishes pending pause from acknowledged pause, without losing a checkpoint or modifying the original.
4. Verify project deletion and cancellation cannot select a stale result or leak a runtime process. Test concurrent start/resume requests and one-active-job enforcement.
5. Repeat the end-to-end path with a checked local model and bilingual review before claiming a supported Chinese → Russian configuration. Japanese → Russian has a separate release gate.
