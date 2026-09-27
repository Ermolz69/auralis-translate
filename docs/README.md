# Auralis Translate documentation

Status: architecture and staged implementation, 26 September 2026. Strict plain-SRT and plain-WebVTT pipelines, manual renderers, and experimental real-model paths are implemented. Translate SQLite has durable checkpoints, pause requests, and immutable results. The CLI has managed-source translation and resume paths verified with a mock server and a [checked-model WebVTT interruption](../eval/experiments/2026-09-25-cli-vtt-interruption.md). An [experimental pinned CPU package](../eval/experiments/2026-09-25-offline-cpu-install.md) installs from locally supplied, hash-verified assets; a [resumable downloader](../eval/experiments/2026-09-25-resumable-download.md) now acquires those assets into a verified cache. Auralis now has an experimental application-data installer and selection UI, with local adapter evidence and a native UI install/select, restart, and one-cue CPU translation test; clean offline verification remains open. Auralis has strict inspection, project links, managed runtime admission, desktop controls, ready artifact publication, a [checked-model worker-kill/resume test](../eval/experiments/2026-09-25-managed-worker-crash.md), a [native checked-model translation test](../eval/experiments/2026-09-25-native-tauri-translation.md), and native desktop crash/restart tests for [SRT](../eval/experiments/2026-09-25-native-tauri-crash.md) and [strict WebVTT](../eval/experiments/2026-09-25-native-vtt-crash-resume.md) through both databases. Committed progress events have supporting and native evidence; production quality, broader WebVTT coverage, and language release gates remain open. See [implementation status](IMPLEMENTATION_STATUS.md) for verified evidence.

The detailed [version 2.0 plan](../AURALIS_SUBTITLE_TRANSLATION_PLAN.md) remains at the repository root in Russian as a historical source. The [English product plan](PRODUCT_PLAN.md) and the architecture documents record the later decisions for the first file-based translation product. Where the historical plan conflicts with an agreed MVP decision below, this directory takes precedence; its research, format cautions, and release gates still apply.

Agents should also read the repository-level [AGENTS.md](../AGENTS.md) before implementation work.

## Start here

The [delivery plan](DELIVERY_PLAN.md), [canonical backlog](IMPLEMENTATION_BACKLOG.md)
and [agent workflow](AGENT_WORKFLOW.md) now govern execution and progress. They
cover composed scene context, chunk boundaries, complete long files, independent
review, conditional fine-tuning, real Auralis dubbing and primary Git authorship.
The backlog replaces the temporary stage queue; S0–S9 acceptance remains applicable.

The [translation quality and model selection plan](evaluation/007-translation-quality-improvement-plan.md)
orders regression data, a controlled 1.8B/7B precision comparison, composable
context/terminology, desktop delivery, review and separate language release gates.
The first [real 1.8B/7B comparison](../eval/experiments/2026-09-27-model-size-comparison.md)
now records 240 requests through matched fidelity profiles. The separate
[7B CLI profile and commands](reference/hy-mt2-7b-cli-v1.md) are available;
independent language review and desktop selection remain open.

The [Chinese currency protection experiment](../eval/experiments/2026-09-27-chinese-currency-protection.md)
adds an explicit [prompt-v4 profile](reference/chinese-fidelity-profile-v1.md).
Repeated real file runs preserve the observed yuan prices and independent
foreign-currency amounts. General language quality and desktop-default selection
remain open; the HTML report retains v1 alongside the new evidence.

The latest [native historical branch record](../eval/experiments/2026-09-27-native-historical-branch.md)
verifies actual checked-model translation, older-base editing, explicit attachment
and reopening through React/Tauri, both databases and three immutable output files.
Untouched cues come from the chosen base; restart preserves selection, edit digests
and checkpoints without another inference attempt. The later [native core interruption record](../eval/experiments/2026-09-27-native-historical-result-gap.md)
also passes forced termination after branch commit: startup restores its output
as ready history and preserves a newer explicit choice. Journal-only and staged
publication interruption, the CLI branch interface and full S7 remain open.

| Document                                                                                        | Purpose                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [English product plan](PRODUCT_PLAN.md)                                                         | Current overall product scope, models, format boundaries, delivery, evaluation and release gates.                                                                    |
| [Delivery plan](DELIVERY_PLAN.md) | Authoritative finish sequence, context/long-file experiments, optional training and separate dubbing gates. |
| [Canonical backlog](IMPLEMENTATION_BACKLOG.md) | Stable task IDs, states, prerequisites and evidence; source for public progress. |
| [Agent workflow](AGENT_WORKFLOW.md) | Execution, checks, reproducible comparisons, reporting and primary-account commit authorship. |
| [Historical implementation stages](IMPLEMENTATION_STAGES.md) | S0–S9 acceptance references; task ordering and status now live in the canonical backlog. |
| [Implementation status](IMPLEMENTATION_STATUS.md)                                               | Evidence for implemented slices, command examples, and open stage gates.                                                                                             |
| [Remaining work](REMAINING_WORK.md)                                                             | Ordered engineering, quality, installation and review work with observable completion criteria.                                                                      |
| [Ready result history](architecture/014-result-history-selection.md)                            | Separate preview and attachment, verified historical selection, cursor pages and preserved active runs.                                                              |
| [Result history evidence](../eval/experiments/2026-09-26-result-history-selection.md)           | Supporting concurrency/integrity checks and actual native edit, preview, attachment and reopening.                                                                   |
| [Committed progress events](architecture/013-committed-progress-events.md)                      | Host commit ordering, existing event bridge, project-scoped refresh and polling recovery.                                                                            |
| [Progress event evidence](../eval/experiments/2026-09-26-committed-progress-events.md)          | SQLite, frontend and native verification with explicit scope and remaining limits.                                                                                   |
| [CLI machine protocol v1](reference/cli-protocol-v1.md)                                         | Explicit JSON requests, JSON/JSONL output, durable progress, terminal outcomes and opt-in exit codes.                                                                |
| [Machine package protocol evidence](../eval/experiments/2026-09-26-cli-package-protocol.md)     | Separate-model commands, verified cache and installation receipts, typed failures, process regressions and real pinned-asset checks.                                 |
| [Open data and language evaluation](evaluation/001-open-data-and-language-gates.md)             | Candidate licensed corpora, provenance requirements, frozen splits, bilingual review, and S8/S9 language evidence.                                                   |
| [Local profile comparison](evaluation/004-model-profile-comparison.md)                          | Frozen development inputs, decoding/prompt variants, same-file controls, failure retention and unreviewed comparison reports.                                        |
| [Long-file recovery probe](evaluation/005-long-file-recovery.md)                                | Optimized CLI, large synthetic SRT/WebVTT inputs, exact checkpoint recovery, full-file checks and approximate resource sampling.                                     |
| [Clean Windows installation protocol](evaluation/006-clean-windows-installation.md)             | Unseeded model setup, interrupted download, offline translation, installer identity and the remaining clean-machine gate.                                            |
| [Fresh MSI and separate QA handoff](../eval/experiments/2026-09-26-windows-msi-cancellation.md) | Production cancellation build, materialized payload checks and independently supplied setup probes; clean installation remains unexecuted.                           |
| [FLORES-200 acquisition](../eval/experiments/2026-09-25-flores200-acquisition.md)               | Locally cached, hash-pinned auxiliary Chinese/Japanese-to-Russian sentence corpus; no subtitle release claim.                                                        |
| [FLORES-200 provider smoke](../eval/experiments/2026-09-25-flores200-provider-smoke.md)         | Checked local model output for one Chinese and one Japanese sentence, with unresolved source/reference divergence.                                                   |
| [Native result-gap recovery](../eval/experiments/2026-09-25-native-result-gap.md)               | Killed-desktop evidence for a validated Translate result committed before Auralis publication, followed by ready-artifact recovery.                                  |
| [Native single-owner storage](../eval/experiments/2026-09-25-native-single-owner.md)            | Two real desktop processes compete for one application-data root; only the first reaches storage setup.                                                              |
| [Native project deletion](../eval/experiments/2026-09-25-native-project-deletion.md)            | Running checked-model attempt cancelled through project deletion, with both database records and managed files cleaned.                                              |
| [Auralis strict-WebVTT integration](../eval/experiments/2026-09-25-auralis-vtt-two-db.md)       | Two real SQLite files, managed source import, mock-model host job, pending publication, and a separate ready WebVTT artifact.                                        |
| [Native checked-model WebVTT](../eval/experiments/2026-09-25-native-vtt-translation.md)         | One-cue React/Tauri run through the managed model, both SQLite files, and a byte-preserving separate WebVTT artifact.                                                |
| [Native WebVTT crash and resume](../eval/experiments/2026-09-25-native-vtt-crash-resume.md)     | Two-cue checked-model run survives desktop termination after one committed block and publishes the resumed separate copy.                                            |
| [Standalone CLI WebVTT interruption](../eval/experiments/2026-09-25-cli-vtt-interruption.md)    | Three-cue checked-model CLI run survives process termination after one committed block and resumes into a separate verified copy.                                    |
| [Commons subtitle pilot inventory](evaluation/002-commons-pilot-inventory.md)                   | Fixed candidate page revisions, rights and alignment gaps, and the decision to keep one multilingual video out of release holdouts.                                  |
| [Native-speech subtitle candidates](evaluation/003-native-speech-candidates.md)                 | Chinese and Japanese source-speech discovery items, observed cue coverage, and rights, parser, and bilingual-review admission steps.                                 |
| [Offline CPU install evidence](../eval/experiments/2026-09-25-offline-cpu-install.md)           | Pinned upstream assets, a real offline package installation and model digest check, with clean-machine limits.                                                       |
| [Resumable asset download](../eval/experiments/2026-09-25-resumable-download.md)                | Pinned HTTPS acquisition, partial-file recovery tests, and online installation evidence.                                                                             |
| [Auralis package selection](../eval/experiments/2026-09-26-auralis-package-selection.md)        | Application-data installation, pinned selection marker, Windows checkout hash fix, and local adapter evidence.                                                       |
| [Native package translation](../eval/experiments/2026-09-26-native-package-translation.md)      | Native UI install/select, desktop restart, selected CPU runtime, and one ready separate SRT result.                                                                  |
| [File translation pipeline](architecture/001-file-translation-pipeline.md)                      | Immutable source, extraction, model input, separate working copy, structural verification.                                                                           |
| [Storage and lifecycle](architecture/002-storage-and-lifecycle.md)                              | Data ownership across two SQLite databases, project links, checkpoints, pause/resume, publication and recovery.                                                      |
| [Auralis integration](architecture/003-auralis-integration.md)                                  | Host responsibilities, integration API, current Auralis gaps, Git submodule and delivery order.                                                                      |
| [Rust code architecture](architecture/004-rust-code-architecture.md)                            | Crate dependencies, module and test layout, typed contracts, configuration and code conventions.                                                                     |
| [Optional WebVTT cue identity decision](architecture/005-optional-webvtt-cue-identity.md)       | How absent external cue IDs round-trip through the existing Translate SQLite schema.                                                                                 |
| [Host translation jobs](architecture/006-host-translation-jobs.md)                              | Proposed Auralis job ownership, run/attempt IDs, cancellation, committed progress, and crash recovery before S7 is complete.                                         |
| [Model installation](architecture/007-model-installation.md)                                    | Release manifest, verified staging, package layout, host ownership, and remaining delivery work.                                                                     |
| [Managed runtime memory](architecture/008-managed-runtime-memory.md)                            | Explicit transient cache/slot policy following observed memory growth in a long-file run.                                                                            |
| [Active request cancellation](architecture/009-request-cancellation.md)                         | Control-aware provider, bounded response reads, request interruption and durable pause acknowledgment.                                                               |
| [Attempt admission guard](architecture/010-attempt-admission-guard.md)                          | Durable control revisions prevent a newer pause or competing attempt from being treated as resume permission.                                                        |
| [Real request-pause evidence](../eval/experiments/2026-09-26-request-cancellation.md)           | Busy checked-model slot, durable SRT/WebVTT pause, preserved checkpoints, resume and offline re-export.                                                              |
| [Native pause and resume](../eval/experiments/2026-09-26-native-pause-resume.md)                | One desktop process, both SQLite files, cancelled first job, child release, retained checkpoint and ready resumed result.                                            |
| [Native WebVTT pause and resume](../eval/experiments/2026-09-26-native-vtt-pause-resume.md)     | Same-process strict-WebVTT recovery, exact first checkpoint, no partial artifact and ready separate result.                                                          |
| [Glossary input v1](reference/glossary-v1.md)                                                   | Experimental terminology JSON, target scope, frozen revision, and resume behavior.                                                                                   |
| [Strict plain-WebVTT subset v1](reference/webvtt-subset-v1.md)                                  | Separately verified text extraction, durable CLI copy and recovery contract; release validation remains open.                                                        |

## Agreed MVP decisions

The [preparation cancellation contract](architecture/011-preparation-cancellation.md)
is implemented with [controlled evidence](../eval/experiments/2026-09-26-preparation-cancellation.md).
[Native post-child preparation pause](../eval/experiments/2026-09-26-native-preparation-pause.md)
now passes through the actual panel, zero admitted records, observed child release
and fresh resume. [Native initial-hash pause](../eval/experiments/2026-09-26-native-initial-hash-pause.md)
also passes an observed incomplete hash, zero admitted records, a 52 ms UI
acknowledgment and fresh full verification before a ready separate result.
The [native concurrent-start probe](../eval/experiments/2026-09-26-native-concurrent-starts.md)
also verifies two `BUSY` replies during that hash and reuse of one accepted host
job by two parallel requests during worker preflight, followed by one ready result.
Additional command races and real process-cleanup failure remain open.

The [host execution status contract](architecture/012-host-execution-status.md)
retains preparation after the scheduler accepts a job while the worker verifies
the runtime. [Supporting and native evidence](../eval/experiments/2026-09-26-host-execution-status.md)
records the exact tested implementation. The later [committed event slice](../eval/experiments/2026-09-26-committed-progress-events.md) verifies the existing job transport and ready panel refresh while retaining recovery polling.

The [admission completion regression](../eval/experiments/2026-09-26-admission-completion-cleanup.md)
fixes the cleanup-error masking branch while retaining final durable guard checks.
Its controlled error injection is separate from real process-cleanup evidence.

The [native accepted-worker pause record](../eval/experiments/2026-09-26-native-worker-preflight-pause.md)
records actual admission and worker-preflight Pause clicks, cancelled host work
without a Translate attempt, and fresh resume on the same project-linked run.
Per-invocation identities and verification scope remain in that record.

Recent evidence: [pinned package repair](../eval/experiments/2026-09-26-package-repair.md) and a [ten-sentence real file/reference comparison](../eval/experiments/2026-09-26-flores-file-comparison.md). The latter verifies the transport pipeline with synthetic timings; its local side-by-side report remains unreviewed and has concrete quality-triage items. Neither record closes the language release gates.

A [three-profile real comparison](../eval/experiments/2026-09-26-profile-comparison.md) now tests sampling, greedy decoding and the existing JSON wrapper on the same development rows. All file checks passed; visible grammar and terminology defects remain, and no winner or production profile was selected.

A [1024-cue long-file recovery investigation](../eval/experiments/2026-09-26-long-file-recovery.md) now passes optimized CLI interruption/resume for SRT and WebVTT, including exact saved checkpoints and offline re-export. Four real format runs compare an omitted RAM-cache argument with explicit zero; sampled model working set fell from about 5.7 GB to 1.54 GB on the observed machine. The managed cache policy is explicit; the repeated synthetic text does not supply linguistic release evidence.

A [fresh Windows MSI audit](../eval/experiments/2026-09-26-windows-msi-content.md) now verifies actual extracted application/media/license files and exclusion of weights/test data. Package application identity accounts for Tauri's temporary package marker and captures every post-signing byte. The [clean Windows protocol](evaluation/006-clean-windows-installation.md) remains unexecuted; installer content alone does not close G9.

| Topic               | Decision                                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Input               | An existing subtitle file. Start with a strict plain-SRT subset; add a documented WebVTT subset after independent validation.                                        |
| Output              | A separate Russian file in the supported source format, plus a versioned result linked to a project.                                                                 |
| Original            | An immutable managed artifact in Auralis, retained for comparison, editing workflows, and future runs.                                                               |
| File processing     | Parse only declared translatable spans. Render a new working copy from the original bytes and verified translations.                                                 |
| Translate database  | One SQLite file per installation, with project IDs on records. It lives in application data, not the source repository.                                              |
| Cross-database link | Auralis stores a stable `translation_id`, active `run_id`, selected `result_id`, and its own ready artifact ID. Detailed translation data stays in Translate SQLite. |
| Interruption        | The project link survives pause and failure. Only committed checkpoints count as saved progress.                                                                     |
| Publication         | Auralis attaches a result after its managed artifact reaches `ready`; a structurally valid result with language warnings is attached with a **Needs review** label.  |
| Repository          | `auralis-translate` evolves independently and is added to Auralis as a Git submodule pinned to a commit.                                                             |

Voice markup, TTS, ASR, subtitle timing creation from text, live translation, and source-specific YouTube event normalisation are outside this first product. They may consume an approved Russian result through Auralis later. Chinese → Russian is the first language gate; Japanese → Russian has its own later gate. Representative language quality and release hardware/speed requirements remain unvalidated.

## Changes from the root plan

The [delivery audit](../eval/experiments/2026-09-26-translation-delivery-audit.md) records the explicit separation of application releases, upstream model downloads, and ignored local test data. Public GitHub publication is deferred by the repository owner; the local submodule workflow continues.

| Root plan sections | MVP clarification                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §1, §3, §8         | Text-only input remains a possible future core capability; it is not part of the first file-based MVP or its completion criteria.                              |
| §4–5               | The requested nested repository uses a Git submodule. Auralis still calls the Rust library directly from its backend.                                          |
| §8–10              | The source artifact stays immutable; output is assembled as a separate file from original bytes and a source map.                                              |
| §14–16             | Translate SQLite owns runs, checkpoints, edits, results, and detailed diagnostics. Auralis owns project links, host jobs, publications, and managed artifacts. |
| §17, §22–23        | The first complete user path is existing file → Russian file → project link. Text-to-subtitle creation is deferred.                                            |

Active documentation in `docs/` and `AGENTS.md` is written in English. The root Russian plan is retained as a historical source by the repository owner's choice.

## Historical edit foundation

The [explicit branch contract](architecture/015-historical-result-edits.md) and
[foundation evidence](../eval/experiments/2026-09-26-historical-edit-foundation.md)
record Translate schema v6 ancestry and the Auralis schema v10 metadata-only
journal. Core and journal tests pass. The later application record linked above
covers supporting save/recovery/publication; typed CLI/UI and native branch-edit
integration remain open.

## Manual publication ordering

The [historical-edit contract](architecture/015-historical-result-edits.md) now has
[host ordering evidence](../eval/experiments/2026-09-26-manual-publication-ordering.md).
Explicit manual results complete as attached or ready historical artifacts without
silently replacing a newer project choice. The later application record linked
above covers supporting historical save/replay; typed CLI/UI and native branch
evidence remain pending.
