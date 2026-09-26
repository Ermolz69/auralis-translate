# Admission-completion cleanup-error precedence

Date: 26 September 2026. Auralis implementation follows local `f39b307` with
Translate pinned to `8436a3c`. Work remains local; no publication, new assets or
model downloads occur in this correction.

## Finding and correction

The previous [host status record](2026-09-26-host-execution-status.md) identified
the completion branch in Auralis `admit_runtime.rs`: after acquisition returned,
the final guard used `?` before the acquired error was inspected. A new pause or
control-read error could therefore hide a typed `CleanupFailed`. The periodic
cancellation branch already preserved that error.

The correction performs the same final durable guard check and retains its
outcome. `CleanupFailed` is returned unchanged before that outcome can replace
it. Successful leases and ordinary runtime errors still require a successful
guard; no stale start is admitted. The existing native mapping of this typed
error remains `RECOVERY_REQUIRED`. No core, model, database, IPC or CLI schema
changes are introduced. This conforms to [the preparation contract](../../docs/architecture/011-preparation-cancellation.md).

## Deterministic regression

`translation_admission_completion.rs` exercises `RunManagedTranslationUseCase::admit`,
not a newly public private helper. The shared fixture installs a test-only control
decorator around the real Translate adapter. The test runtime marks acquisition
completed and immediately returns an error in the same future poll. Only after
that marker does the decorator request a real durable pause in the final
`capture_start` call; it optionally returns a typed control-read failure.
There is no timing sleep or simulated model delay. Earlier polling cannot consume
the marker. A bounded timeout detects hangs, while the recorded completion check
assertion requires that the final guard actually ran.

Two tests each cover two cases:

| Acquisition outcome      | Final guard outcome              | Required result              |
| ------------------------ | -------------------------------- | ---------------------------- |
| `CleanupFailed`          | New durable pause                | Exact original cleanup error |
| `CleanupFailed`          | Control-read failure after pause | Exact original cleanup error |
| Ordinary runtime failure | New durable pause                | `Cancelled`                  |
| Ordinary runtime failure | Control-read failure after pause | Typed control-read error     |

Every case checks the retained paused run and unchanged original. The real Auralis
database has zero host jobs, associations and publications; Translate has zero
attempts, checkpoints and results. The separate helpers remain under `tests/support/`.
The fixture's optional control wrapper adds no production API or dependency.

## Verification

- Before the production correction,
  `task rs:test:application -- --test translation_admission_completion` exits 101:
  cleanup precedence fails with "Final control changes hid the runtime cleanup
  failure"; the ordinary-error control test passes. This reproduces the reviewed
  branch rather than relying only on inspection.
- After correction,
  `task rs:test:application -- --test translation_admission_completion --test translation_admission_pause --test translation_run_status`
  passes all 12 tests: two completion cases, eight existing admission cases and
  two host-status cases. The completion pair executes four distinct outcome paths.
- `task rs:test:application` passes the full default suite: 103 unit tests and
  all integration tests, including the new completion pair. Three installed-model
  cases remain explicitly ignored; this run supplies no new inference evidence.
- `task rs:fmt-write`, `task rs:clippy` and `task q:file-size` pass.
- `task rs:test:desktop -- --test translation_cleanup_error` passes its separate
  integration test. The actual application-error mapper serializes cleanup failure
  as `RECOVERY_REQUIRED` with restart guidance, omits private resource/diagnostic
  strings, and still serializes ordinary cancellation as `CANCELLED`.
  The initial restricted build fails with OS error 5 while Tauri prepares an
  existing media resource; the same command passes with local build-script
  permission. This environment failure is not an observed product cleanup error.
- `task q:duplicate-code` passes its production frontend policy; it does not
  check Rust test duplication.

## Limits

The injected runtime errors exercise application error ownership through actual
storage. They do not reproduce failed Windows child termination or reaping, run
native inference, select a model/profile or close the clean-installation and
bilingual quality gates. The prior native status/preparation record remains
evidence for its prior tested binary; it is not relabelled as a fresh native run
for this correction. Initial-hash native interruption, actual Pause during worker
preflight, repeated preparation pause and concurrent command/deletion/publication
interleavings remain open.

Follow-up: [the native worker-preflight scenario](2026-09-26-native-worker-preflight-pause.md)
now verifies that actual Pause boundary and a named repeated preparation sequence.
It does not inject `CleanupFailed` or reproduce Windows kill/reap failure; this
controlled completion-error record retains its original scope.
