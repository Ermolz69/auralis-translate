# Accepted host work and native preflight status

Date: 26 September 2026. Implementation follows local Auralis `eee8aa6`, with
Translate code at `9d553da`. Development remains local; no model/corpus download
or public publication occurred.

## Product change

[Host execution status](../../docs/architecture/012-host-execution-status.md)
adds a read-only application projection and required nullable `activeHostJobId`
to the desktop status DTO. The existing project-scoped Translate snapshot and
the exact run's unclosed Auralis host association remain in their own databases.
The projection checks host project/kind ownership and propagates storage errors.
It does not change core run phases, saved counts, Translate SQLite or CLI output.

The panel keeps preparation visible after acceptance, disables another start or
resume and permits pause before the first Translate attempt. It restores that
state from storage after remount. Accepted job/run identity also bridges the
pending command to a delayed first status refresh. UI polling remains unchanged;
this is not an event-progress implementation or a model hash percentage.

## Commands and supporting evidence

- `task rs:test:application -- --test translation_run_status`: two cases pass
  through two actual SQLite files. An idle paused run has no job; pending/running
  host work retains its ID while Translate stays paused; terminalization releases
  the ID without creating an attempt. Another project is rejected and a missing
  host-association table yields an error instead of an idle projection.
- `task rs:test:application`: the full default suite passes, including 103 unit
  tests and all integration tests. Three explicitly installed-model cases remain
  opt-in; this default suite is not real model evidence.
- `task fe:test:components -- src/features/translation-run-control/ui/TranslationRunControl.test.tsx`:
  nine cases pass, including initial/resumed acceptance, remount, pause controls,
  delayed first refresh and committed progress. Start mocks now return the actual
  accepted job/run shape.
- `task fe:test:unit -- src/shared/api/contracts/runtimeValidation.test.ts`:
  fifteen cases pass; missing/empty/non-UUID/non-string active job values fail.
- `task q:ipc-contract`: five tests and real command/event parity pass.
- `task q:fsd-boundaries`: checker tests and frontend import rules pass.
- `task rs:clippy`: all workspace targets pass with warnings denied. The first
  new Rust test used an undeclared rusqlite dependency; it now uses existing SQLx
  in read-only mode. Shared test builders are reused with scoped expected dead-code
  lints for their unused test-only operations, rather than changing production
  lint policy or adding convenience fields to every admission fixture.
- `task fe:typecheck`, `task fe:lint`, `task q:file-size` and
  `task q:duplicate-code`: pass on the final implementation.
- `task fe:build`: bundle budgets and actual production delivery checks pass for
  16 frontend files, with no emitted test modules, weights or evaluation data.

## Native evidence

The native helper now waits until the resumed run reports a host ID while its
Translate phase is still paused. It unmounts/remounts the actual run panel, requires
the preparation label and Pause, rejects an enabled Continue action, and records
`translation-worker-preflight-visible`. The outer verifier requires that marker,
then keeps the original exact job/attempt/output/source/child assertions.

The first enhanced `task desktop:e2e:native:translation:preparation-pause` exited
0 and reported `worker_preflight_ui_restored: true`. Its pause acknowledgement was
259 ms, all seven partial/admission counts were zero, and fresh resume produced
one completed job/closed attempt and the same source-preserving separate output.
That binary was built before the delayed-refresh handoff fix; a fresh invocation
therefore rebuilt the native binary and repeated the full scenario against the
final frontend. It also exited 0, reported `worker_preflight_ui_restored: true`
and acknowledged preparation pause in 209 ms. All seven counts were zero at pause;
resume created exactly one completed host job and one closed attempt. The source
and output digests matched the first enhanced run, and the test sandbox was cleaned.

| First enhanced run identity | Value                                                              |
| --------------------------- | ------------------------------------------------------------------ |
| Run                         | `9877686c-df6b-49bd-99dd-c31cb14051fb`                             |
| Translation                 | `3906d727-db62-48c1-b580-1b076f496da9`                             |
| Observed first model child  | 26296, parent matched the desktop                                  |
| Completed resumed host job  | `594626a6-19b6-41be-a139-4577c7af8e92`                             |
| Source SHA-256              | `e88cbac25d7b05d1bd1f19d738b2eb3d8b5198e5ad550b9960f1de98cc0776a8` |
| Output SHA-256              | `e1bd07b25695411ec29cc5a55813e3c0e7094de94cebf8c3e528682127325cf3` |

| Final implementation repeat | Value                                  |
| --------------------------- | -------------------------------------- |
| Run                         | `299aca99-1a48-49d0-8fdc-fb7a44250be3` |
| Translation                 | `d872c9bb-3a59-4cdb-a0f3-8fb6fc2abfbf` |
| Observed first model child  | 27144, parent matched the desktop      |
| Completed resumed host job  | `7bd16465-1ae4-4291-a169-a19d79ae9707` |
| Pause acknowledgement       | 209 ms                                 |

The earlier 259 ms and final 209 ms values are individual development-machine
observations, not a responsiveness SLA. The native helper verifies restored Pause
controls during worker preflight; it does not click Pause at that second boundary.

## Remaining scope

Native initial-hash interruption, pause actually clicked during worker preflight,
repeated resume/pause and concurrent deletion/publication need separate evidence.
Event-driven progress, a fresh current installer audit, clean Windows setup and
bilingual Chinese/Japanese release gates remain open. This authored one-cue test
does not select a production profile or establish a hardware/latency SLA.
Admission completion also needs a regression for cleanup-error precedence: a
final durable guard check can mask an acquisition `CleanupFailed` if control
changes at that boundary. The polling-cancellation path already preserves it.
See [remaining engineering work](../../docs/REMAINING_WORK.md).

Follow-up: the [admission-completion regression](2026-09-26-admission-completion-cleanup.md)
reproduces and corrects the masking branch with its own controlled evidence. This
record retains the original finding and native implementation scope.

Further follow-up: [native accepted-worker preflight pause](2026-09-26-native-worker-preflight-pause.md)
now clicks Pause at the previously visibility-only boundary, cancels one host job
without a Translate attempt/result, releases its model and resumes the same run
through a distinct completed job. Its final rebuilt invocation is recorded there.
