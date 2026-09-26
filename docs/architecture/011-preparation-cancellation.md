# Cooperative preparation cancellation

Status: implementation in progress, 26 September 2026.

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
