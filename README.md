# Auralis Translate

An independent Rust engine for translating existing subtitle files into separate Russian copies. Auralis provides project storage, desktop controls, model lifecycle, and result selection; Translate owns parsing, translation contracts, checkpoints, edits, and immutable results in its own SQLite database.

The current implementation is **experimental**. Strict plain-SRT and a documented plain-WebVTT subset have [real-model and recovery evidence](docs/IMPLEMENTATION_STATUS.md). Source-matched language quality, clean Windows installation, representative long-file performance, and the Chinese/Japanese release gates remain open in the [canonical backlog](docs/IMPLEMENTATION_BACKLOG.md) and [release map](docs/RELEASE_ACCEPTANCE.md).

## Start here

- [Developer guide: setup, CLI, recovery and contribution](docs/DEVELOPER_GUIDE.md)
- [Documentation index](docs/README.md)
- [Document inventory and authority map](docs/DOCUMENT_MAP.md)
- [Current English product plan](docs/PRODUCT_PLAN.md)
- [Delivery plan: context, long files and dubbing](docs/DELIVERY_PLAN.md)
- [Canonical task backlog and progress](docs/IMPLEMENTATION_BACKLOG.md)
- [Agent workflow, evaluation and commit authorship](docs/AGENT_WORKFLOW.md)
- [Release acceptance and finite goal completion](docs/RELEASE_ACCEPTANCE.md)
- [Regression maintenance policy](docs/evaluation/008-regression-and-adversarial-checks.md)
- [Reusable execution goal](docs/GOAL_PROMPT.md)
- [Historical S0–S9 acceptance stages](docs/IMPLEMENTATION_STAGES.md)
- [Rust architecture](docs/architecture/004-rust-code-architecture.md)
- [CLI machine protocol v1](docs/reference/cli-protocol-v1.md)
- [Separate-model package protocol evidence](eval/experiments/2026-09-26-cli-package-protocol.md)
- [Agent instructions](AGENTS.md)

The Russian [historical plan](AURALIS_SUBTITLE_TRANSLATION_PLAN.md) stays at the root. Later agreed file-based MVP decisions are recorded in English under `docs/`.

## Local checks and commands

Install the pinned Rust toolchain from `rust-toolchain.toml`, Task, and Node.js.
From the repository root, after dependencies are available, the first check needs
no model, network request, or Auralis desktop session:

```text
task docs:check
task plan:check
task cli -- inspect crates/auralis-translation-formats/tests/fixtures/plain.srt
```

`task check` covers Rust formatting, Clippy, and workspace tests. Default tests
use synthetic fixtures and mock providers; they do not establish translation
quality. `task cli -- inspect-vtt PATH_TO_SOURCE.vtt` checks the declared strict
WebVTT subset without inference. [The developer guide](docs/DEVELOPER_GUIDE.md)
separates model-free checks, supplied-asset checks and real inference.

For inference, `translate`, `translate-vtt` and `resume` connect to a separately
started loopback llama.cpp server. `translate-local`, `translate-vtt-local` and
`resume-local` own a checked server child for one CLI run when the pinned runtime
and model are already present. See the [CLI protocol](docs/reference/cli-protocol-v1.md)
for positional arguments and ownership limits; the [native acceptance](eval/experiments/2026-10-10-cli-local-runtime-result.md)
covers bounded real-model paths, not language release. The earlier
[ten-row comparison](eval/experiments/2026-09-26-flores-file-comparison.md) is
a development transport and quality-triage record.

Model acquisition and installation are separate commands. `fetch-release`,
`fetch-asset`, `install-offline` and `install-online` accept machine JSON requests
and produce JSON/JSONL verified cache/package receipts. Run `task test:cli:packages`
for their process regressions or `task eval:cli:packages ASSET_DIR=ABSOLUTE_CACHE`
with separately supplied real pinned assets. Weights and probe reports remain
outside Git and application bundles; installation does not start translation.

`task eval:cli:flores:profiles` compares frozen decoding/prompt variants with supplied local assets. The [real comparison evidence](eval/experiments/2026-09-26-profile-comparison.md) records passing transport checks and unresolved translation defects. Complete comparison reports stay in ignored local storage; evaluation does not download weights or select a production profile automatically.

`task eval:cli:long:interruption` runs optimized CLI recovery checks on authored 1024-cue SRT and WebVTT files with supplied assets. The [long-file record](eval/experiments/2026-09-26-long-file-recovery.md) verifies interruption, exact checkpoint retention and offline re-export, and records sampled memory before and after an explicit runtime-cache setting. This technical probe does not establish subtitle adequacy or a throughput SLA.

## Model and test-data delivery

Third-party model weights are never embedded in the application or uploaded to our release. Auralis downloads pinned upstream assets only after the user's **Download and install** action and selects a package after verification. The standalone CLI also supports explicit `fetch-release`, `install-online`, and separately supplied assets through `install-offline`; see [model installation](docs/architecture/007-model-installation.md).

Local GGUF/runtime caches, external corpora, generated comparison fixtures, reports, and SQLite test state stay under ignored `.cache/` or isolated temporary directories. They do not enter production bundles. [Delivery evidence](eval/experiments/2026-09-26-translation-delivery-audit.md) distinguishes verified development checks from remaining clean-machine gates. Preserve the upstream model/runtime license notices independently of source-code licensing.

## Auralis integration

Auralis pins this repository at `modules/auralis-translate` as a Git submodule and uses Cargo path dependencies. Translate SQLite owns translation details; Auralis SQLite stores project links and ready artifact selection. Original subtitles stay immutable, and partial results are not published. See [integration](docs/architecture/003-auralis-integration.md) and [storage lifecycle](docs/architecture/002-storage-and-lifecycle.md).

The [public Translate repository](https://github.com/Ermolz69/auralis-translate)
exists; this was checked on 17 October 2026. The earlier local-only publication
decision in the [26 September delivery audit](eval/experiments/2026-09-26-translation-delivery-audit.md)
is historical. A [28 September record](eval/experiments/2026-09-28-goal-plan-audit.md)
reports a successful Pages deployment; a configured workflow or local site build
alone does not confirm that a new commit is live. Source publication and the
Auralis submodule pin are separate from product release acceptance.
