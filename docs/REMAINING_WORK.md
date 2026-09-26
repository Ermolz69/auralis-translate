# Remaining work toward the file-based product

Status: 26 September 2026. This is an ordered summary for the owner and agents,
not a replacement for [the product plan](PRODUCT_PLAN.md),
[stage gates](IMPLEMENTATION_STAGES.md) or [evidence](IMPLEMENTATION_STATUS.md).
Development and commits remain local. Public GitHub publication is deferred by
the owner.

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

| Priority          | Work                                                        | Observable completion                                                                                                                                                                                     | Current limit                                                                                                                                                                                                                                                                                                                                                               |
| ----------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                 | Admission cancellation and concurrency (S4/S7, G7)          | Pause interrupts model preparation safely; simultaneous start/resume/pause, deletion and publication have deterministic ownership and real desktop evidence.                                              | [Control revisions](architecture/010-attempt-admission-guard.md) reject stale starts; cooperative hashing/package/readiness checks pass. [Native post-child preparation pause](../eval/experiments/2026-09-26-native-preparation-pause.md) passes actual controls, zero admitted records and child absence. Initial-hash native cancellation and command races remain open. |
| 2                 | Source-aware translation quality (S5/S8/S9, G3/G4/G5)       | A rights-cleared representative subtitle development set and frozen holdout receive bilingual adequacy, critical-error and terminology review; Chinese and Japanese pass independently.                   | Auxiliary FLORES sentence comparisons and authored probes remain unreviewed. Visible grammar/term defects remain. No production model/profile is selected and Japanese is not enabled in the durable product workflow.                                                                                                                                                      |
| 3                 | Clean Windows delivery (S6/S8, G9)                          | An unseeded target installs the application, explicitly downloads/selects the separate model, survives interrupted download, restarts and translates offline; package identity and signature checks pass. | A real unsigned MSI content audit and a separate ignored QA handoff exist. The clean-machine report is unexecuted. Fresh packages must be rebuilt/audited after later product changes.                                                                                                                                                                                      |
| 4                 | Complete CLI/runtime/package lifecycle (S6)                 | Machine installation/download commands, declared typed provider failures, runtime ownership, interrupted startup and upgrade/removal/orphan cleanup work without losing selected data.                    | JSON/JSONL translation/control/export exists; the CLI still requires a caller-supplied running local server. Package install/select/repair has evidence, while upgrade/removal and orphan cleanup remain open.                                                                                                                                                              |
| 5                 | Complete project review workflow (S7)                       | A user selects historical ready revisions, compares/edits them and receives committed progress through events; recovery cannot silently choose an older pending output.                                   | Current UI compares the selected result, supports a single-segment revision and polls status. Backend revision/publication recovery exists, but the full user workflow needs implementation and native interaction checks.                                                                                                                                                  |
| 6                 | Format, resource and consumer coverage (S1/S8, G1/G2/G6/G8) | Varied fixture/corpus and fuzz checks enforce the advertised subsets; output opens in named target consumers; CPU/GPU hardware and coexistence limits are measured.                                       | Synthetic long SRT/WebVTT recovery and explicit bounded runtime-cache evidence exist. Rich format syntax is rejected; target-player, representative resource and hardware SLAs remain open.                                                                                                                                                                                 |
| Deferred by owner | Public repository and release workflow                      | Approved Translate history is published and another clone/CI can initialize the pinned submodule and build without weights/test corpora.                                                                  | Continue local-only work. No public Translate remote or publication has been performed.                                                                                                                                                                                                                                                                                     |

Quality and clean-machine work can proceed alongside engineering once the
required subtitle provenance/reviewer and isolated target are available. Do not
substitute another synthetic translation run for either gate.

## Next engineering slice

Extend the [cooperative preparation control](architecture/011-preparation-cancellation.md)
evidence to native UI pause during observed initial hashing and additional repeated
or simultaneous commands. The [post-child case](../eval/experiments/2026-09-26-native-preparation-pause.md)
already records a 310 ms acknowledgement, zero job/attempt/result, model absence
and fresh resume. Retain the durable guard at the final transaction boundary and
complete same-process command/deletion/publication interleavings. The UI also needs
event-driven committed progress. The [host status projection](architecture/012-host-execution-status.md)
now represents accepted worker preflight while Translate retains its paused phase;
[its evidence](../eval/experiments/2026-09-26-host-execution-status.md) records the
scope of restored controls.

The [accepted-worker native pause](../eval/experiments/2026-09-26-native-worker-preflight-pause.md)
now passes after the first admission pause and panel remount on the same run:
one host job is cancelled before any Translate attempt/result, its child is
absent at verification, and another fresh job completes one attempt. The final
213 ms admission and 3056 ms worker acknowledgments are individual debug/polling
observations, not a general SLA. That named repeated preparation sequence is
verified; initial-hash and concurrent/deletion/publication interleavings remain.

For CLI lifecycle work, reuse the existing human-facing `fetch-release`,
`fetch-asset`, `install-offline` and `install-online` operations. Their structured
request/output and typed package/download failure integration remain outside
machine protocol v1; implement those boundaries before claiming complete machine
installation support.

The [admission-completion regression](../eval/experiments/2026-09-26-admission-completion-cleanup.md)
now covers the previously found cleanup-error masking branch. Final guard reads
remain mandatory, and `CleanupFailed` survives a newer pause or read failure.
The controlled regression does not reproduce an actual Windows kill/reap failure;
that process-failure scenario and command interleavings remain open.

For the language gate, follow [the provenance/review protocol](evaluation/001-open-data-and-language-gates.md)
and [the native-speech candidate admission steps](evaluation/003-native-speech-candidates.md).
For packaging, use [the clean Windows protocol](evaluation/006-clean-windows-installation.md).
