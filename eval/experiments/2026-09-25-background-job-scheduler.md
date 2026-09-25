# Auralis background translation job attachment

Date: 25 September 2026. This record covers the S7 Auralis scheduler slice, not a release gate or bilingual quality result.

## Behavior

The Tauri `start_translation_run_cmd` admits the frozen project run and checked local model, commits a pending host job, reserves its ID in Auralis's existing `JobManager`, and attaches a gated worker. It then returns `{ jobId, runId, state: "accepted" }` over IPC. The attached worker executes the Translate attempt, mirrors only committed checkpoints into the host job, releases its model process, and stages the separate output publication. The subtitle UI polls the linked run and project selection; it no longer waits for inference to finish inside the start command.

If registry reservation or worker attachment fails, the pending host job is terminalized. A crash after durable creation is handled by the existing startup reconciliation and scoped host-job recovery. Runtime shutdown requests a durable Translate pause; the current model request can finish before the worker observes the pause. A completed Translate result is selected only after Auralis's artifact outbox makes the new copy ready.

## Checks observed

- `task rs:test:application -- --test translation_host_execution_failure` and `task rs:test:application`: passed. The focused test checks admission before execution, a failed model request, a scheduled retry, terminal host-job state, and unchanged source bytes. The full application suite passed its active unit and integration tests; three opt-in checked-model tests remained ignored in that default run.
- `task rs:check` and `task rs:clippy`: passed for the Auralis workspace; the check needed normal desktop filesystem access to read the existing ffmpeg sidecar.
- `task fe:typecheck`, `task fe:test:unit`, and `task fe:test:components`: passed; the IPC contract validates the accepted job/run response. The final unit run passed 181 tests in 30 files, and the component run passed 240 tests in 50 files.
- `task desktop:e2e:native:translation`: passed with the installed checked Hy-MT2 Q4_K_M model on Windows. The native verifier checked React, IPC, the managed worker, both SQLite files, the ready separate artifact, and unchanged original bytes. The first attempt used the former 60-second post-admission test deadline and failed before publication; the test now allows 180 seconds after admission to cover a real model invocation.
- `task desktop:e2e:native:translation:crash`: passed after the test captured the managed model PID before the first checkpoint, eliminating a slow process listing between checkpoint detection and termination. The native verifier observed one retained checkpoint after killing the first desktop, model-child cleanup, a second host attempt on the same run, two final checkpoints, a validated run, and the selected ready output. The first attempt at this gate missed the intended single-checkpoint boundary; its diagnostic exposed the timing race in the test harness.

## Limits

The start command still waits for checked-model admission and process startup before returning; the translation itself runs in the background. A test-only runtime config points at already installed, untracked model assets. Model installation, progress events, native result-commit interruption, concurrent desktop-process testing, and bilingual subtitle evaluation remain open. Mock and native lifecycle evidence do not establish Chinese or Japanese translation quality.
