# Cooperative preparation cancellation

Status: implementation, controlled checks, native post-child preparation and accepted-worker pause,
26 September 2026. Initial-hash native interruption and command races remain open.

The [durable admission guard](010-attempt-admission-guard.md) prevents stale starts.
Preparation must also stop promptly when the owner pauses the run. Auralis polls
the linked run/phase/control revision during acquisition and signals an owned
cancellation token on a newer pause, changed run, deleted link or control-read
failure. It awaits acquisition cleanup before returning; it does not detach or
simply abandon a blocking hash/probe worker.

The model adapter exposes a small synchronous preparation-control callback.
Model hashing checks it before opening, between bounded chunks and before
returning a digest. Package verification checks archive hashing, decompression,
installed-file hashing and directory traversal. Readiness probes check it during
HTTP headers/body reads. The managed runtime combines cancellation with its
startup deadline, joins each worker and releases its own child/slot before it
acknowledges cancellation. Model identity and package integrity requirements stay
unchanged. The callback does not introduce SQLite, Tauri or a runtime token into
the translation core.

The validated Auralis admission poll policy accepts 10–1000 ms, defaulting to
250 ms. SQLite's transient `AttemptStartControl` throttles guard reads during
hashing with the same request-control default; the CLI and host executor recheck
the guard unconditionally after preflight, including on a provider failure.
The existing startup deadline bounds readiness and post-launch preflight, while
the initial file check remains cooperatively cancellable. No hashing worker is
abandoned by `timeout_at`. Failed child cleanup is a typed `CleanupFailed` error
that overrides a normal cancellation acknowledgment and maps to the existing
`RECOVERY_REQUIRED` native error code.

At acquisition completion, the final durable guard check is still performed.
Its outcome is retained until the acquisition result is classified: a typed
`CleanupFailed` takes precedence over a newer pause or guard-read failure.
For a successful lease or any ordinary runtime error, the failed guard remains
authoritative and prevents admission. The [completion regression](../../eval/experiments/2026-09-26-admission-completion-cleanup.md)
records the corrected branch and deterministic two-database evidence. This applies
the existing cleanup contract; it does not weaken atomic attempt admission.

The desktop panel exposes **Pause** while its start/resume request is pending and
labels that phase as model preparation. An acknowledged cancellation refreshes the
retained paused run without a failure alert. This preparation-token change leaves
status wire schemas unchanged; the later [host execution projection](012-host-execution-status.md)
adds a desktop-only active job identity for accepted worker preflight.

Immediate filesystem calls may still block in the OS. The contract is cooperative
cancellation at declared chunk/request boundaries, not a guarantee to preempt an
arbitrary device operation. The final attempt transaction still requires the
durable guard; cancellation alone cannot authorize a fresh resume.

## Evidence required

Controlled tests must interrupt hashing, package verification and incomplete
readiness responses; verify no abandoned request/worker; and allow a fresh check.
The two-database application test must stop admission without releasing its
runtime barrier, retain the original/linked run and create no job/attempt/result.
Native UI preparation pause must separately observe acknowledgement latency and
model-child cleanup. These gates are open until their actual outputs are recorded.

Controlled library, CLI-process, two-database and React checks now have
[recorded evidence](../../eval/experiments/2026-09-26-preparation-cancellation.md).
A [native post-child case](../../eval/experiments/2026-09-26-native-preparation-pause.md)
observes actual controls, one 310 ms UI acknowledgement, zero jobs/attempts/results,
child absence at paused verification and fresh resume. It does not establish a
general latency SLA or prove native interruption during the initial hash.

The [accepted-worker native scenario](../../eval/experiments/2026-09-26-native-worker-preflight-pause.md)
extends observation to an admitted host job whose worker is still checking the
model before atomic Translate attempt creation. The actual Pause control must
cancel that job, close its association, advance the guard revision and release
its child without creating a checkpoint or result. The same run then resumes
through a distinct host job; invocation evidence is recorded separately.
