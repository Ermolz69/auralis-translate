# Remaining work toward the file-based product

Ordering notice, 28 September 2026: use the [delivery plan](DELIVERY_PLAN.md) and
[canonical backlog](IMPLEMENTATION_BACKLOG.md) for current work and status. The
lists below retain earlier slice detail, not a competing task queue. Agent
execution and primary-account authorship follow [the workflow](AGENT_WORKFLOW.md).

Status: 26 September 2026. This is an ordered summary for the owner and agents,
not a replacement for [the product plan](PRODUCT_PLAN.md),
[stage gates](IMPLEMENTATION_STAGES.md) or [evidence](IMPLEMENTATION_STATUS.md).
Translate source and the authored development report are now published on GitHub
and Pages following the owner's later request. The new
[quality improvement plan](evaluation/007-translation-quality-improvement-plan.md)
specifies the model comparison and language work; publication does not close
quality or desktop release gates. The first matched
[1.8B/7B Q4 development comparison](../eval/experiments/2026-09-27-model-size-comparison.md)
and a separate 7B CLI profile now exist; the larger holdout and precision matrix
remain outstanding.

## Working foundation

The strict plain-SRT and plain-WebVTT paths extract declared text slots, preserve
protected structure, retain immutable originals and render separate Russian
outputs. The checked experimental model has completed local CLI and native desktop
runs. Both databases retain linked unfinished runs, validated checkpoints and
immutable results. Named crash, result-publication gap and pause/resume tests pass.
These tests establish the documented narrow paths; they do not certify translation
quality, every format feature, every race or a clean installation.

Models are acquired separately from upstream pinned assets into application data;
weights and evaluation payloads are excluded from application/release content.
The local Git submodule pins the independent Translate implementation.

## Ordered completion work

| Priority          | Work                                                        | Observable completion                                                                                                                                                                                     | Current limit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1                 | Admission cancellation and concurrency (S4/S7, G7)          | Pause interrupts model preparation safely; simultaneous start/resume/pause, deletion and publication have deterministic ownership and real desktop evidence.                                              | [Control revisions](architecture/010-attempt-admission-guard.md) reject stale starts. Native [initial-hash](../eval/experiments/2026-09-26-native-initial-hash-pause.md), [post-child](../eval/experiments/2026-09-26-native-preparation-pause.md) and [accepted-worker](../eval/experiments/2026-09-26-native-worker-preflight-pause.md) pause boundaries pass. [Parallel native starts](../eval/experiments/2026-09-26-native-concurrent-starts.md) also pass BUSY/reuse boundaries. Additional command orderings, concurrent Pause/deletion/publication and actual process-cleanup failure remain open.                                                                                                                                 |
| 2                 | Source-aware translation quality (S5/S8/S9, G3/G4/G5)       | A rights-cleared representative subtitle development set and frozen holdout receive bilingual adequacy, critical-error and terminology review; Chinese and Japanese pass independently.                   | Auxiliary FLORES sentence comparisons and authored probes remain unreviewed. Visible grammar/term defects remain. No production model/profile is selected and Japanese is not enabled in the durable product workflow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 3                 | Clean Windows delivery (S6/S8, G9)                          | An unseeded target installs the application, explicitly downloads/selects the separate model, survives interrupted download, restarts and translates offline; package identity and signature checks pass. | A real unsigned MSI content audit and a separate ignored QA handoff exist. The clean-machine report is unexecuted. Fresh packages must be rebuilt/audited after later product changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 4                 | Complete CLI/runtime/package lifecycle (S6)                 | Machine installation/download commands, declared typed provider failures, runtime ownership, interrupted startup and upgrade/removal/orphan cleanup work without losing selected data.                    | JSON/JSONL translation/control/export and verified package receipts exist; the CLI still requires a caller-supplied running local server. Package install/select/repair has evidence, while upgrade/removal and orphan cleanup remain open.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 5                 | Complete project review workflow (S7)                       | A user selects historical ready revisions, compares/edits them and receives committed progress through events; recovery cannot silently choose an older pending output.                                   | Current UI compares selected and historical ready results, supports guarded ready-base single-segment edits and refreshes status through events with recovery polling. Native history/edit/selection/reopen and supporting concurrency/integrity checks pass. The [event slice](../eval/experiments/2026-09-26-committed-progress-events.md) has supporting and native evidence. Explicit branch save/publication/recovery has supporting two-database evidence; typed desktop controls have supporting checks; native older-base saves/reopening and core commit interruption now preserve a newer explicit choice; CLI branch delivery, journal-only and staged publication interruption, fuller diagnostics and user validation remain. |
| 6                 | Format, resource and consumer coverage (S1/S8, G1/G2/G6/G8) | Varied fixture/corpus and fuzz checks enforce the advertised subsets; output opens in named target consumers; CPU/GPU hardware and coexistence limits are measured.                                       | Synthetic long SRT/WebVTT recovery and explicit bounded runtime-cache evidence exist. Rich format syntax is rejected; target-player, representative resource and hardware SLAs remain open.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Published; release still open | Public repository and release workflow | Translate source and the authored development report are public; release and submodule/clean-clone gates stay separate. | Repository and Pages publication are complete. Follow the canonical backlog for remaining release delivery; no local-only restriction remains. |

Quality and clean-machine work can proceed alongside engineering once the
required subtitle provenance/reviewer and isolated target are available. Do not
substitute another synthetic translation run for either gate.

## Next engineering slice

The [native concurrent-start probe](../eval/experiments/2026-09-26-native-concurrent-starts.md)
now verifies two extra `BUSY` requests during initial hashing and two replies
reusing one accepted worker job. Pause acknowledges in 235 ms with zero admitted
records, then the same run completes one job/attempt and a ready separate result.
These named boundaries pass; simultaneous Pause/deletion/publication, other
request orderings and actual process-cleanup failure remain engineering work.

Extend the [cooperative preparation control](architecture/011-preparation-cancellation.md)
evidence to additional repeated or simultaneous commands. The
[native initial-hash case](../eval/experiments/2026-09-26-native-initial-hash-pause.md)
now records an actual interrupted partial read, 52 ms UI acknowledgment, zero
admitted records and three distinct full checks on resume before a ready separate
result. The [post-child case](../eval/experiments/2026-09-26-native-preparation-pause.md)
already records a 310 ms acknowledgement, zero job/attempt/result, model absence
and fresh resume. Retain the durable guard at the final transaction boundary and
complete same-process command/deletion/publication interleavings. The UI now has
event-driven committed progress with [native evidence](../eval/experiments/2026-09-26-committed-progress-events.md). [Ready history](../eval/experiments/2026-09-26-result-history-selection.md) now passes actual native editing, preview, explicit attachment and reopening. Older-base editing now has [native completed-save/reopening evidence](../eval/experiments/2026-09-27-native-historical-branch.md); core commit interruption now preserves a newer explicit choice, while journal-only and staged publication interruption and fuller review interactions remain open. The [host status projection](architecture/012-host-execution-status.md)
now represents accepted worker preflight while Translate retains its paused phase;
[its evidence](../eval/experiments/2026-09-26-host-execution-status.md) records the
scope of restored controls.

The [accepted-worker native pause](../eval/experiments/2026-09-26-native-worker-preflight-pause.md)
now passes after the first admission pause and panel remount on the same run:
one host job is cancelled before any Translate attempt/result, its child is
absent at verification, and another fresh job completes one attempt. The final
213 ms admission and 3056 ms worker acknowledgments are individual debug/polling
observations, not a general SLA. That named repeated preparation sequence is
verified; concurrent/deletion/publication interleavings remain. The initial-hash
case is separately verified above; these observations do not close G7 as a whole.

The [machine package extension](../eval/experiments/2026-09-26-cli-package-protocol.md)
now covers `fetch-release`, `fetch-asset`, `install-offline` and `install-online`
with structured requests, verified receipts and typed package/download failures.
The next CLI lifecycle work is owned server startup/shutdown, finer provider
failure reasons, and upgrade/removal/orphan cleanup. Clean Windows download,
interruption and offline use remain independent delivery gates.

The [admission-completion regression](../eval/experiments/2026-09-26-admission-completion-cleanup.md)
now covers the previously found cleanup-error masking branch. Final guard reads
remain mandatory, and `CleanupFailed` survives a newer pause or read failure.
The controlled regression does not reproduce an actual Windows kill/reap failure;
that process-failure scenario and command interleavings remain open.

For the language gate, follow [the provenance/review protocol](evaluation/001-open-data-and-language-gates.md)
and [the native-speech candidate admission steps](evaluation/003-native-speech-candidates.md).
For packaging, use [the clean Windows protocol](evaluation/006-clean-windows-installation.md).

## Historical edit foundation

The [branch contract](architecture/015-historical-result-edits.md) now has
[engine and host-journal supporting evidence](../eval/experiments/2026-09-26-historical-edit-foundation.md).
Translate schema v6 preserves explicit edit ancestry and guards the observed head;
Auralis schema v10 stores metadata-only intents and pages them independently of
current project selection. The later [application record](../eval/experiments/2026-09-26-historical-edit-application.md)
now covers supporting save/recovery/publication integration. The [desktop record](../eval/experiments/2026-09-26-historical-edit-desktop-contract.md)
adds typed observations/save/status contracts and experimental controls. The
[native branch record](../eval/experiments/2026-09-27-native-historical-branch.md)
now passes older-base saves, explicit attachment and reopening without inference
replay. The later [native core interruption record](../eval/experiments/2026-09-27-native-historical-result-gap.md)
passes committed-branch recovery while preserving a newer explicit choice.
Journal-only and staged-file/outbox interruption and the CLI branch route are the
next work.
This foundation does not close project review or release gates.

## Manual branch publication foundation

The [ordering contract](architecture/015-historical-result-edits.md) now has
[eight host transaction regressions](../eval/experiments/2026-09-26-manual-publication-ordering.md).
Explicit manual results can complete as ready history without overriding current
selection, while pending automatic publication remains recoverable. The next
historical-edit work is now journal-only and staged publication interruption and
CLI branch delivery. The native core interruption record passes one process-kill
boundary; completed-save/reopening passes in the native branch record. Typed
guards, frozen UI retries and honest attachment outcomes have
supporting evidence in the desktop record above. The later application
record covers intent admission, core branch invocation and request/provenance
verification; it does not complete project review.
