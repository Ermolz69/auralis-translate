# Attempt admission and newer pause requests

Status: implementation decision, 26 September 2026. A two-database application
regression reproduces a pause lost during model admission: a requested run becomes
paused while the runtime prepares, then the executor treats that pause as ordinary
resume permission. Repeating pause while an already-paused run is preparing to
resume must also stop that older start request.

## Decision

Translate SQLite schema v5 adds a nonnegative integer `control_revision` to runs,
initially zero for migrated records. Every accepted pause and every successful
attempt start increments it transactionally. No source, checkpoint, edit or result
payload changes. The counter invalidates older start decisions even when the phase
is still `paused`, and prevents reuse after another attempt has started and failed.

A start captures a typed guard containing the run ID, phase and control revision
in one database read before model preparation. Auralis retains it across admission,
job scheduling and executor preflight. The final attempt-start transaction requires
the same phase and revision before it clears pause and inserts the attempt. A newer
pause rejects the stale start as cancellation; a competing attempt is a conflict.
Explicit resume captures the latest guard, so a previously acknowledged pause can
be resumed while a later pause remains effective.
Pause also accepts a failed run, moving it to paused while retaining its previous
attempt diagnostics, so preparation of a failed-run retry can be stopped too.

Auralis checks the guard again after runtime admission, before creating a host job,
even when acquisition returns an error. A newer pause takes precedence; a failure
without a control change retains its runtime error. Job creation requires the
original run ID. A pause after job creation is
checked atomically before inference, closes the host job as cancelled and creates
no Translate attempt/result. The project keeps its active run and saved blocks.
The standalone CLI captures a guard before checked-server preflight too.

The existing immediate `begin_attempt` and initial-only methods remain primitives
for callers already deciding to start at that boundary. Compositions that prepare
resources first must use the guarded method. Guard metadata is transient host
control information; it is not copied into Auralis project SQLite or exposed as a
new public frontend status schema.

## Remaining scope

The guard prevents lost pauses and stale attempt starts. It is now composed with
[cooperative preparation control](011-preparation-cancellation.md), which has
controlled library, CLI, application and UI checks. A
[native post-child preparation case](../../eval/experiments/2026-09-26-native-preparation-pause.md)
now verifies zero admitted records and fresh resume. A separately observed
[native initial-hash pause](../../eval/experiments/2026-09-26-native-initial-hash-pause.md)
also interrupts partial hashing before job/attempt admission and performs fresh
complete checks on resume. Concurrent deletion/publication and native IPC race
scenarios still require their own evidence. Existing active-inference
cancellation remains governed by [the request contract](009-request-cancellation.md).
