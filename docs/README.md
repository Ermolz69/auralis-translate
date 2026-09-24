# Auralis Translate documentation

Status: architecture and staged implementation, 24 September 2026. The strict plain-SRT pipeline, manual renderer, and real-model experimental paths are implemented. Translate SQLite has migrations, durable checkpoint/attempt primitives, pause requests, and immutable result records. The CLI has a managed-source `translate`/`pause`/`resume` path verified with a mock model server. A checked experimental profile also passed a real-model server preflight smoke. Production quality, WebVTT, and Auralis integration remain open. See [implementation status](IMPLEMENTATION_STATUS.md) for verified evidence.

The detailed [version 2.0 plan](../AURALIS_SUBTITLE_TRANSLATION_PLAN.md) remains at the repository root in Russian as a historical source. The [English product plan](PRODUCT_PLAN.md) and the architecture documents record the later decisions for the first file-based translation product. Where the historical plan conflicts with an agreed MVP decision below, this directory takes precedence; its research, format cautions, and release gates still apply.

Agents should also read the repository-level [AGENTS.md](../AGENTS.md) before implementation work.

## Start here

| Document | Purpose |
| --- | --- |
| [English product plan](PRODUCT_PLAN.md) | Current overall product scope, models, format boundaries, delivery, evaluation and release gates. |
| [Temporary implementation stages](IMPLEMENTATION_STAGES.md) | Observable steps from text extraction to real inference, durable state, Auralis integration, and release gates. Agents use this until a tracked backlog replaces it. |
| [Implementation status](IMPLEMENTATION_STATUS.md) | Evidence for implemented slices, command examples, and open stage gates. |
| [File translation pipeline](architecture/001-file-translation-pipeline.md) | Immutable source, extraction, model input, separate working copy, structural verification. |
| [Storage and lifecycle](architecture/002-storage-and-lifecycle.md) | Data ownership across two SQLite databases, project links, checkpoints, pause/resume, publication and recovery. |
| [Auralis integration](architecture/003-auralis-integration.md) | Host responsibilities, integration API, current Auralis gaps, Git submodule and delivery order. |
| [Rust code architecture](architecture/004-rust-code-architecture.md) | Crate dependencies, module and test layout, typed contracts, configuration and code conventions. |
| [Glossary input v1](reference/glossary-v1.md) | Experimental terminology JSON, target scope, frozen revision, and resume behavior. |

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
