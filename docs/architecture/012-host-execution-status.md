# Host execution status during checked preflight

Date: 26 September 2026. Decision: expose the active Auralis host-job identity in
the desktop translation status projection. Implementation evidence is recorded
separately; this decision alone is not a verified stage gate.

## Reason

The [native preparation case](../../eval/experiments/2026-09-26-native-preparation-pause.md)
found an observable interval after the start command accepts a host job and before
its worker begins a guarded Translate attempt. The worker verifies the checked
server/model first. On resume, Translate's durable phase can still be `paused`
during this work. Clearing local UI preparation state on command return therefore
shows an idle pause, offers another resume and hides Pause while work is active.

## Contract and ownership

A new application read use case combines the existing project-scoped Translate
snapshot with `TranslationHostJobStore::active_for_run`. Its result contains the
unchanged snapshot and an optional typed Auralis job ID. It validates the returned
job's project and translation kind. The command only maps that application result.

`get_translation_run_status_cmd` adds the required nullable `activeHostJobId`
field to its desktop DTO. `null` means no unclosed host association was observed
for that exact run. A value identifies its active host association; it is not an
additional Translate attempt or checkpoint. Translate's core/port snapshot,
SQLite schema, CLI machine protocol and result metadata are unchanged. The desktop
and native mapper ship together; frontend validation rejects a missing or malformed
field. This is an experimental local IPC contract change.

The projection reads both databases independently and is observational. It does
not authorize a start, resume or publication. The durable admission guard and
atomic attempt-start check remain authoritative. Errors retrieving host state
propagate instead of reporting an idle run. Auralis does not copy source text,
checkpoints or results to create this projection.

## UI interpretation

The panel labels a pending start command as preparation. After acceptance,
`activeHostJobId` keeps the preparation label for requested, paused or failed
Translate phases, disables another Start/Continue, and keeps Pause available until
a pause is requested. Running and validated Translate phases retain their existing
labels and committed counts. A still-open host association during cancellation
prevents another resume until cleanup/terminalization releases it.
Before clearing its local pending command, the panel uses the accepted job/run
identity to retain preparation for that same run until refreshed storage status
arrives. A delayed first refresh must not expose an idle Start/Continue button.

This state survives panel remount because it is read from storage. Polling remains
the current refresh mechanism; coherent status is not evidence for event-driven
progress. Model hash/readiness sub-stages and percentages are not inferred from
the active job ID.

## Verification required

- Real two-database reads distinguish an idle paused run, an admitted preflight,
  and a released terminal host job; another project cannot obtain its status.
- Runtime validation requires a nullable job identity, including error cases.
- Component tests cover initial/resumed acceptance, remount, Pause during worker
  preflight and return to an idle resume after job release.
- A native checked-model run observes the actual preparation label and controls
  while an accepted host job exists but no Translate attempt has started, then
  completes the same run without duplicate attempts or changed originals.
