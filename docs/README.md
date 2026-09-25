# Auralis Translate documentation

Status: architecture and staged implementation, 26 September 2026. Strict plain-SRT and plain-WebVTT pipelines, manual renderers, and experimental real-model paths are implemented. Translate SQLite has durable checkpoints, pause requests, and immutable results. The CLI has managed-source translation and resume paths verified with a mock server and a [checked-model WebVTT interruption](../eval/experiments/2026-09-25-cli-vtt-interruption.md). An [experimental pinned CPU package](../eval/experiments/2026-09-25-offline-cpu-install.md) installs from locally supplied, hash-verified assets; a [resumable downloader](../eval/experiments/2026-09-25-resumable-download.md) now acquires those assets into a verified cache. Auralis now has an experimental application-data installer and selection UI, with local adapter evidence and a native UI install/select, restart, and one-cue CPU translation test; clean offline verification remains open. Auralis has strict inspection, project links, managed runtime admission, desktop controls, ready artifact publication, a [checked-model worker-kill/resume test](../eval/experiments/2026-09-25-managed-worker-crash.md), a [native checked-model translation test](../eval/experiments/2026-09-25-native-tauri-translation.md), and native desktop crash/restart tests for [SRT](../eval/experiments/2026-09-25-native-tauri-crash.md) and [strict WebVTT](../eval/experiments/2026-09-25-native-vtt-crash-resume.md) through both databases. Event-driven progress, production quality, broader WebVTT coverage, and language release gates remain open. See [implementation status](IMPLEMENTATION_STATUS.md) for verified evidence.

The detailed [version 2.0 plan](../AURALIS_SUBTITLE_TRANSLATION_PLAN.md) remains at the repository root in Russian as a historical source. The [English product plan](PRODUCT_PLAN.md) and the architecture documents record the later decisions for the first file-based translation product. Where the historical plan conflicts with an agreed MVP decision below, this directory takes precedence; its research, format cautions, and release gates still apply.

Agents should also read the repository-level [AGENTS.md](../AGENTS.md) before implementation work.

## Start here

| Document | Purpose |
| --- | --- |
| [English product plan](PRODUCT_PLAN.md) | Current overall product scope, models, format boundaries, delivery, evaluation and release gates. |
| [Temporary implementation stages](IMPLEMENTATION_STAGES.md) | Observable steps from text extraction to real inference, durable state, Auralis integration, and release gates. Agents use this until a tracked backlog replaces it. |
| [Implementation status](IMPLEMENTATION_STATUS.md) | Evidence for implemented slices, command examples, and open stage gates. |
| [Open data and language evaluation](evaluation/001-open-data-and-language-gates.md) | Candidate licensed corpora, provenance requirements, frozen splits, bilingual review, and S8/S9 language evidence. |
| [FLORES-200 acquisition](../eval/experiments/2026-09-25-flores200-acquisition.md) | Locally cached, hash-pinned auxiliary Chinese/Japanese-to-Russian sentence corpus; no subtitle release claim. |
| [FLORES-200 provider smoke](../eval/experiments/2026-09-25-flores200-provider-smoke.md) | Checked local model output for one Chinese and one Japanese sentence, with unresolved source/reference divergence. |
| [Native result-gap recovery](../eval/experiments/2026-09-25-native-result-gap.md) | Killed-desktop evidence for a validated Translate result committed before Auralis publication, followed by ready-artifact recovery. |
| [Native single-owner storage](../eval/experiments/2026-09-25-native-single-owner.md) | Two real desktop processes compete for one application-data root; only the first reaches storage setup. |
| [Native project deletion](../eval/experiments/2026-09-25-native-project-deletion.md) | Running checked-model attempt cancelled through project deletion, with both database records and managed files cleaned. |
| [Auralis strict-WebVTT integration](../eval/experiments/2026-09-25-auralis-vtt-two-db.md) | Two real SQLite files, managed source import, mock-model host job, pending publication, and a separate ready WebVTT artifact. |
| [Native checked-model WebVTT](../eval/experiments/2026-09-25-native-vtt-translation.md) | One-cue React/Tauri run through the managed model, both SQLite files, and a byte-preserving separate WebVTT artifact. |
| [Native WebVTT crash and resume](../eval/experiments/2026-09-25-native-vtt-crash-resume.md) | Two-cue checked-model run survives desktop termination after one committed block and publishes the resumed separate copy. |
| [Standalone CLI WebVTT interruption](../eval/experiments/2026-09-25-cli-vtt-interruption.md) | Three-cue checked-model CLI run survives process termination after one committed block and resumes into a separate verified copy. |
| [Commons subtitle pilot inventory](evaluation/002-commons-pilot-inventory.md) | Fixed candidate page revisions, rights and alignment gaps, and the decision to keep one multilingual video out of release holdouts. |
| [Native-speech subtitle candidates](evaluation/003-native-speech-candidates.md) | Chinese and Japanese source-speech discovery items, observed cue coverage, and rights, parser, and bilingual-review admission steps. |
| [Offline CPU install evidence](../eval/experiments/2026-09-25-offline-cpu-install.md) | Pinned upstream assets, a real offline package installation and model digest check, with clean-machine limits. |
| [Resumable asset download](../eval/experiments/2026-09-25-resumable-download.md) | Pinned HTTPS acquisition, partial-file recovery tests, and online installation evidence. |
| [Auralis package selection](../eval/experiments/2026-09-26-auralis-package-selection.md) | Application-data installation, pinned selection marker, Windows checkout hash fix, and local adapter evidence. |
| [Native package translation](../eval/experiments/2026-09-26-native-package-translation.md) | Native UI install/select, desktop restart, selected CPU runtime, and one ready separate SRT result. |
| [File translation pipeline](architecture/001-file-translation-pipeline.md) | Immutable source, extraction, model input, separate working copy, structural verification. |
| [Storage and lifecycle](architecture/002-storage-and-lifecycle.md) | Data ownership across two SQLite databases, project links, checkpoints, pause/resume, publication and recovery. |
| [Auralis integration](architecture/003-auralis-integration.md) | Host responsibilities, integration API, current Auralis gaps, Git submodule and delivery order. |
| [Rust code architecture](architecture/004-rust-code-architecture.md) | Crate dependencies, module and test layout, typed contracts, configuration and code conventions. |
| [Optional WebVTT cue identity decision](architecture/005-optional-webvtt-cue-identity.md) | How absent external cue IDs round-trip through the existing Translate SQLite schema. |
| [Host translation jobs](architecture/006-host-translation-jobs.md) | Proposed Auralis job ownership, run/attempt IDs, cancellation, committed progress, and crash recovery before S7 is complete. |
| [Model installation](architecture/007-model-installation.md) | Release manifest, verified staging, package layout, host ownership, and remaining delivery work. |
| [Glossary input v1](reference/glossary-v1.md) | Experimental terminology JSON, target scope, frozen revision, and resume behavior. |
| [Strict plain-WebVTT subset v1](reference/webvtt-subset-v1.md) | Separately verified text extraction, durable CLI copy and recovery contract; release validation remains open. |

## Agreed MVP decisions

| Topic | Decision |
| --- | --- |
| Input | An existing subtitle file. Start with a strict plain-SRT subset; add a documented WebVTT subset after independent validation. |
| Output | A separate Russian file in the supported source format, plus a versioned result linked to a project. |
| Original | An immutable managed artifact in Auralis, retained for comparison, editing workflows, and future runs. |
| File processing | Parse only declared translatable spans. Render a new working copy from the original bytes and verified translations. |
| Translate database | One SQLite file per installation, with project IDs on records. It lives in application data, not the source repository. |
| Cross-database link | Auralis stores a stable `translation_id`, active `run_id`, selected `result_id`, and its own ready artifact ID. Detailed translation data stays in Translate SQLite. |
| Interruption | The project link survives pause and failure. Only committed checkpoints count as saved progress. |
| Publication | Auralis attaches a result after its managed artifact reaches `ready`; a structurally valid result with language warnings is attached with a **Needs review** label. |
| Repository | `auralis-translate` evolves independently and is added to Auralis as a Git submodule pinned to a commit. |

Voice markup, TTS, ASR, subtitle timing creation from text, live translation, and source-specific YouTube event normalisation are outside this first product. They may consume an approved Russian result through Auralis later. Chinese → Russian is the first language gate; Japanese → Russian has its own later gate. Model quality, hardware requirements, and speed remain unmeasured.

## Changes from the root plan

| Root plan sections | MVP clarification |
| --- | --- |
| §1, §3, §8 | Text-only input remains a possible future core capability; it is not part of the first file-based MVP or its completion criteria. |
| §4–5 | The requested nested repository uses a Git submodule. Auralis still calls the Rust library directly from its backend. |
| §8–10 | The source artifact stays immutable; output is assembled as a separate file from original bytes and a source map. |
| §14–16 | Translate SQLite owns runs, checkpoints, edits, results, and detailed diagnostics. Auralis owns project links, host jobs, publications, and managed artifacts. |
| §17, §22–23 | The first complete user path is existing file → Russian file → project link. Text-to-subtitle creation is deferred. |

Active documentation in `docs/` and `AGENTS.md` is written in English. The root Russian plan is retained as a historical source by the repository owner's choice.
