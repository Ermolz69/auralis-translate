# Native model preparation pause and fresh resume

Date: 26 September 2026. Auralis implementation follows local `7cc24a8`; Translate
is pinned to `1e32b06`. This record covers the existing Windows development
machine, actual React run controls, the managed checked model and two SQLite
files. Public publication remains deferred by the owner.

## Scenario and admission boundary

`task desktop:e2e:native:translation:preparation-pause` builds the native-only
frontend and Tauri application in an isolated temporary application-data root.
The authored strict-SRT fixture is one Chinese cue, `你好。`, with its original
timing and identity. The same installed b10977-0ecb159c9 server and Hy-MT2 1.8B
Q4_K_M model are supplied through absolute `AURALIS_TEST_LLAMA_SERVER` and
`AURALIS_TEST_GGUF`. Local CUDA is on PATH; prepared media tools are reused with
`AURALIS_NATIVE_E2E_MEDIA_READY=1`. The managed configuration requests 99 GPU
layers, context 2048, one slot and zero RAM cache. No assets are downloaded.

The native React helper mounts the actual `TranslationRunControl` and clicks
its enabled **Start translation**, **Pause** and **Continue translation** buttons.
It does not replace their IPC implementation or directly invoke start/pause.
The shared scenario still uses ordinary commands to import the immutable source,
freeze the run and verify the final comparison.

The external harness waits for the preparation label/checkpoint and a new
`llama-server.exe`, verifies its Windows parent PID equals the desktop PID, then
checks both real databases. Before allowing the pause click, the run must still
be `requested`, with no host job/association, Translate attempt/checkpoint/result,
publication or translated artifact. A test-only project-title gate coordinates
observation with React; it does not block or alter the model runtime.

After the click, the actual panel must leave its preparation state, show paused
status and enable resume without an alert. The UI records elapsed time with its
monotonic clock, bounded by the test's 10-second acknowledgement limit. The
harness requires the same linked run, a cleared pause flag, unchanged managed
source/hash, all seven counts still zero and no new model child before releasing
resume. This is a post-child-startup preparation boundary; it does not prove
interruption during the earlier initial hash or an active inference request.

Fresh resume must produce exactly one completed host job and one closed Translate
attempt on the same run. The existing output verifier requires a `needs_review`
result, matching database revision/hash, a ready separate artifact, preserved
timing/identity, unchanged managed/external originals and acknowledged outbox
finalizations. The resumed model child must also be released.

## Supporting checks

- `task desktop:e2e:native:preparation:check`: four verifier tests pass, including
  rejection of every nonzero record count, an unfinished pause flag, a changed
  run/link, exposed output and changed original identity.
- `task fe:test:components -- src/features/translation-run-control/ui/TranslationRunControl.test.tsx`:
  six tests pass.
- `task fe:typecheck`, `task fe:lint` and `task q:fsd-boundaries`: pass.
- `task q:translation-delivery`: eight policy/publication tests pass.
- `task q:ipc-contract`: five tests pass and actual command/event parity passes.
- `task fe:build`: production bundle budgets and delivery checks pass; no emitted
  native test modules, model weights or evaluation data in 16 frontend files.
- `task rs:clippy`: all workspace targets pass with warnings denied.
- `task q:file-size` and `task q:duplicate-code`: checker tests and repository
  checks pass.

Initial restricted Node test invocations returned `spawn EPERM`; the same checks
passed with local child-process permission. Those errors are not native behavior.

## Native observation

The first native invocation exited 1 after successfully acknowledging preparation
pause and starting fresh admission. The new helper incorrectly required `running`
immediately when the scheduler's start command returned. That response means the
host job is accepted; the worker still performs checked preflight before the
guarded Translate attempt. The retained run can remain `paused` during that check.
The helper now waits for `running` or `validated`, fails on another phase/alert,
and retains the final exact job/attempt/output assertions. The first failing
sandbox/processes were cleaned.

The full repeat of `task desktop:e2e:native:translation:preparation-pause` exited 0. It observed one model child owned by the desktop before releasing Pause.
At paused verification both databases retained the same linked run, all seven
counts were zero and no new model process remained. Resume produced one completed
host job and one closed Translate attempt, then a validated `needs_review` result
and ready separate source-preserving output. The fixture/app-data sandbox and
native frontend build were cleaned; the model files remain in the ignored cache.

| Observed identity              | Value                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| Run ID                         | `524ee063-ae04-4da8-81e0-44f88e34ad5c`                                                    |
| Translation ID                 | `0fbf9957-4338-4bdb-9ca5-b4ce23eb2693`                                                    |
| Observed first model child PID | 16420, Windows parent matched the desktop                                                 |
| UI acknowledgement             | **310 ms**, one observation on this machine                                               |
| Counts at pause                | Jobs, associations, attempts, checkpoints, results, publications, output artifacts: all 0 |
| Completed resumed job          | `64d28ec6-50a9-40c2-89b3-6dc0ff799af4`                                                    |
| Closed Translate attempts      | 1, linked to that host job                                                                |
| Source SHA-256                 | `e88cbac25d7b05d1bd1f19d738b2eb3d8b5198e5ad550b9960f1de98cc0776a8`                        |
| Output SHA-256                 | `e1bd07b25695411ec29cc5a55813e3c0e7094de94cebf8c3e528682127325cf3`                        |

The emitted report originally named its absence flag
`child_released_before_acknowledgement`. The harness samples processes after UI
acknowledgement, before releasing resume; it does not continuously measure the
termination instant. The report field is corrected to
`child_absent_at_pause_verification` to describe that actual observation. The
runtime still awaits kill/reap before returning cancellation. This reporting
name correction changes no assertion or product behavior.

## Remaining scope

Initial-hash native cancellation, repeated preparation pause during resume,
same-process start/delete/publication interleavings, failed Windows child cleanup,
fresh installer identity and a clean Windows installation remain separate work.
This authored one-cue lifecycle case cannot establish bilingual quality, a
production model profile, hardware minima or a general acknowledgement SLA.
The panel currently labels the pending start command as preparation. After that
command accepts the host job, the worker's checked preflight can still leave the
retained run displayed as paused until attempt creation. A coherent progress
view for that interval remains part of the project UI/event work.

Follow-up: [host execution status](2026-09-26-host-execution-status.md) addresses
that accepted-worker display interval with a nullable host-job identity and a
restored preparation view. This historical record retains the original observed
gap; the follow-up records its own implementation and verification scope.
