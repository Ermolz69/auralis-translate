# Newer pause requests survive attempt admission

Date: 26 September 2026. Translate implementation: `b0d921a`.
Auralis integration is a local change following `9a90354`. No downloads or public
publication were performed. Native admission races and prompt interruption of
hashing/readiness remain open.

## Reproduction and correction

A controlled runtime barrier and two actual SQLite files reproduced a lost pause:
the model admitted an older start after the run had been paused, and the executor
treated that newer pause as permission to resume. The initial regression failed
with `A newer pause was treated as permission to resume` before the correction.

[The admission decision](../../docs/architecture/010-attempt-admission-guard.md)
adds Translate schema v5 and a typed start guard. Every pause/start increments a
durable control revision. The executor verifies the captured run/phase/revision in
an immediate transaction before clearing pause and inserting an attempt. A fresh
explicit resume captures the latest revision. Auralis carries the same guard
through runtime admission, host job creation and executor preflight, and requires
the original active run at host job creation. A newer pause wins even when the
runtime acquisition returns an error. Without a newer pause, that runtime error
is preserved.

## Deterministic evidence

Translate `task test:admission` passed three guard/migration cases and six existing
migration cases. They cover repeated pause, fresh resume, competing attempts,
retry of failed runs, run-ID mismatch and migration of a populated v4 run.
`task check` passed formatting, Clippy and the workspace tests, including seven
CLI process/machine-protocol tests.

Auralis `task rs:test:application -- --test translation_admission_pause` passed
five tests. The first exercises both initial start and an already-paused resume:

- Pause during gated admission creates no host job and drops the acquired lease.
- Pause during a failed acquisition returns cancellation and keeps the run paused.
- Failure without a new pause retains the runtime error and creates no host job.
- Pause after host admission but before execution creates no model HTTP request,
  Translate attempt or result, closes the host job as `cancelled`, drops the lease
  and retains the active project run and unchanged source.
- A fresh explicit resume can admit the existing paused run; a later pause still
  cancels its worker.

The barriers/runtime endpoint are controlled fixtures, not model support evidence.
The source is project-authored. Test helpers live under `tests/support/`.
A pre-existing mock server failure exposed a Windows socket inherited from a
nonblocking listener. Setting the accepted socket explicitly blocking before its
bounded read corrected the test; final `task rs:test:translate` passed all default
adapter tests. The two opt-in installed-model/package tests remain ignored in that
default command. A test initially expected uppercase `Cancelled`; it was corrected
to the actual lowercase stored contract. Clippy's forbidden `expect_err` was
replaced with fallible test handling.

Final Auralis `task rs:clippy` passed with all workspace targets and warnings
denied. `task rs:test:application` passed its full default suite, including the
five new cases, scheduler pause, host job races, publication-gap/worker recovery,
strict WebVTT publication and project cleanup. Its three real-model cases remain
opt-in. `task rs:test:ports` passed 19 contract tests. No frontend wire schema or
production UI behavior changed in this slice.

## Real checked-model CLI regression

`task eval:cli:protocol` passed after the v5/guard change. It builds the optimized
CLI, passes the seven process tests, then uses the already supplied checked model
with `AURALIS_TEST_GPU_LAYERS=99`, the local CUDA PATH, one slot and zero RAM cache.
Four authored cues per format travel through JSON requests/JSONL progress,
durable checkpoints, separate output, exit 3 (`needs_review`) and byte-identical
offline JSON re-export. The harness checks source identity, protected spans,
cue timing/order, result IDs and fingerprints. No model processes remained after
completion.

Retained ignored workspace: `.cache/eval/machine-protocol-runs/protocol-kk6CJv/`.

| Evidence                             | SRT                                                                | WebVTT                                                             |
| ------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Run ID                               | `6fe1c0a4-6376-4f7d-bd5b-8e1b4a758a98`                             | `b3b187b9-ce6e-4f88-8516-d4adaa600473`                             |
| Result ID                            | `9b1f778b-6b2c-491d-8383-96a61d7cf171`                             | `08e41249-f444-4f4d-890a-c0848f9fd27d`                             |
| CLI wall time after server readiness | 6,893.94 ms                                                        | 7,401.86 ms                                                        |
| Output SHA-256                       | `4599a76c62b8455c71f8f9a21de3f039fc3bd22998a23ec17d28f46229ef32be` | `dcefb9d26759347cb06b1babb374631266b4febb351b8e50d0febc392bd8523b` |
| Report SHA-256                       | `51f327bd2e7dac650c73931b64ed2c92aeeae42bd50b0be4d1a6cf2d743e3f3f` | `9aebf1f9d3556e25703d17137e988a41f0a490278ef0de204254b4eb195b6962` |

CLI SHA-256: `bed315f2598bf99facd7d7c434ae91575c5f108025fcaacdadfdd7a101a0da79`.
Profile SHA-256: `dba1d341230bc4f1117c6fba8ce55a1127b120864aa8363295bdbc883b98fc3e`.
Model SHA-256: `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
Runtime: b10977-0ecb159c9. The [authored setup fixture](../fixtures/clean-windows/setup-probe.v1.json)
contains drafts, not bilingual-approved references. This repeat verifies guarded
CLI compatibility, not real cancellation during hashing or language quality.

## Remaining limits

Admission does not yet abort hashing/readiness promptly: a stale acquired lease
is released when acquisition returns. The tests do not establish a latency SLA
or a native command race verdict. The prior native pause records and MSI audit
describe their original tested source revisions; this code change requires its
own future native-admission and fresh-package evidence. See
[remaining work](../../docs/REMAINING_WORK.md).
