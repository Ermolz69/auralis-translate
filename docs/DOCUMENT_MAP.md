# Document inventory and authority

This inventory covers the active English documents in `docs/` on the MNT-01
base. A current contract describes required behavior; it is not evidence that a
gate passed. A dated record keeps its original observation and limit. The
[canonical backlog](IMPLEMENTATION_BACKLOG.md) owns task status, and the
[release map](RELEASE_ACCEPTANCE.md) owns gate definitions. Generated public
progress must be rebuilt from those sources, never edited by hand.

## Entry points and status

| Document | Class and reading rule |
| --- | --- |
| [Documentation index](README.md), [developer guide](DEVELOPER_GUIDE.md), this inventory | Current navigation and onboarding; verify operational claims against linked source and acceptance. |
| [Product plan](PRODUCT_PLAN.md) | Current file/product invariants and G1–G9; dated model candidates remain proposals. |
| [Delivery plan](DELIVERY_PLAN.md) | Current sequence and method; its 28 September baseline and original desktop ordering are historical where later scope records differ. |
| [Canonical backlog](IMPLEMENTATION_BACKLOG.md) | Current task IDs, states, dependencies and scoped acceptance links. Long handoffs below its table are dated evidence, not another status ledger. |
| [Release acceptance](RELEASE_ACCEPTANCE.md), [regression policy](evaluation/008-regression-and-adversarial-checks.md) | Current gate and regression rules; no local check alone promotes a release. |
| [Agent workflow](AGENT_WORKFLOW.md), [AGENTS.md](../AGENTS.md) | Current execution and repository instructions; later explicit owner scope decisions govern named goals. |
| [Implementation status](IMPLEMENTATION_STATUS.md), [remaining work](REMAINING_WORK.md) | Dated acceptance and historical handoff detail. Use the backlog for live task state. |
| [Implementation stages](IMPLEMENTATION_STAGES.md) | Historical S0–S9 acceptance references, not a second queue. |
| [Goal prompt](GOAL_PROMPT.md), [goal fix prompts](GOAL_FIX_PROMPTS.md) | Reusable later execution prompts; reading them activates no work. |

## Architecture

| Document | Class and reading rule |
| --- | --- |
| [001 file pipeline](architecture/001-file-translation-pipeline.md), [002 storage/lifecycle](architecture/002-storage-and-lifecycle.md), [003 Auralis integration](architecture/003-auralis-integration.md), [004 Rust architecture](architecture/004-rust-code-architecture.md) | Current boundaries and design, with dated survey/layout examples explicitly labelled. Use source and acceptance links for implemented claims. |
| [005 optional WebVTT ID](architecture/005-optional-webvtt-cue-identity.md), [006 host jobs](architecture/006-host-translation-jobs.md), [007 model installation](architecture/007-model-installation.md), [008 managed runtime memory](architecture/008-managed-runtime-memory.md) | Narrow current contracts with their recorded implementation limits. |
| [009 request cancellation](architecture/009-request-cancellation.md), [010 admission guard](architecture/010-attempt-admission-guard.md), [011 preparation cancellation](architecture/011-preparation-cancellation.md), [012 host execution status](architecture/012-host-execution-status.md) | Current lifecycle contracts; dated acceptance links define verified boundaries. |
| [013 committed events](architecture/013-committed-progress-events.md), [014 history selection](architecture/014-result-history-selection.md), [015 historical edits](architecture/015-historical-result-edits.md), [015 inference journal](architecture/015-inference-request-journal.md), [016 source names](architecture/016-source-name-registry.md) | Versioned contracts and implementation records; identical numeric prefixes are filenames, not shared version identities. |

## Evaluation and reference contracts

| Document | Class and reading rule |
| --- | --- |
| [001 open data](evaluation/001-open-data-and-language-gates.md), [002 Commons inventory](evaluation/002-commons-pilot-inventory.md), [003 native speech candidates](evaluation/003-native-speech-candidates.md), [004 profile comparison](evaluation/004-model-profile-comparison.md), [005 long-file recovery](evaluation/005-long-file-recovery.md), [006 clean Windows](evaluation/006-clean-windows-installation.md) | Dated inventories, plans and bounded evidence. They do not substitute for current language, audio or installation gates. |
| [007 quality improvement](evaluation/007-translation-quality-improvement-plan.md), [009 blind review](evaluation/009-blind-source-review.md) | Historical ordering and reviewer route; later scope and protocol v2 supersede the applicable parts. |
| [010 paired record](evaluation/010-comparison-record-v1.md), [011 published-reference review v2](evaluation/011-published-reference-review-v2.md) | Current record schema and prospective translator-only assessment protocol. |
| [Bounded failure](reference/bounded-failure-policy-v1.md), [CLI protocol](reference/cli-protocol-v1.md), [glossary](reference/glossary-v1.md), [WebVTT subset](reference/webvtt-subset-v1.md), [source inventory](reference/source-inventory-v1.md) | Versioned interface and format contracts. Check the declared subset before inference. |
| [7B CLI](reference/hy-mt2-7b-cli-v1.md), [Chinese fidelity v1](reference/chinese-fidelity-profile-v1.md), [context v5](reference/chinese-context-profile-v5.md), [target schema v6](reference/chinese-context-profile-v6-target-schema.md), [batch v7](reference/chinese-batch-profile-v7.md) | Versioned profile contracts and experiments; a profile name alone does not prove quality. |
| [Capacity warning](reference/capacity-warning-v1.md), [measurement warning v1](reference/measurement-warning-v1.md), [v2](reference/measurement-warning-v2.md), [v3](reference/measurement-warning-v3.md), [provider review diagnostic](reference/provider-review-diagnostic-v1.md), [report layout v2](reference/public-report-layout-v2.md) | Versioned diagnostics/report contracts, with older variants retained for provenance. |
| [Model text tail guard](reference/model-text-json-tail-guard-v1.md), [tail retry v1](reference/model-text-json-tail-retry-v1.md), [v2](reference/model-text-json-tail-retry-v2.md), [name admission](reference/name-proposal-admission-v1.md), [provisional terms v1](reference/provisional-target-terms-v1.md), [v2](reference/provisional-target-terms-v2.md) | Narrow versioned safeguards and admission policies; linked evidence scopes their claims. |
| [Source clock diagnostic](reference/source-clock-time-diagnostic-v1.md), [strict source clock](reference/strict-source-clock-time-v1.md), [source identifier diagnostic](reference/source-identifier-diagnostic-v1.md), [strict identifier guard](reference/strict-source-identifier-guard-v1.md), [source prefix repair v1](reference/source-prefix-repair-v1.md), [v2](reference/source-prefix-repair-v2.md) | Distinct diagnostic, strict-admission and repair contracts; earlier versions remain reproducible. |

## Maintenance and generated output

| Document | Class and reading rule |
| --- | --- |
| [Maintenance packet](maintenance/README.md), [review](maintenance/REVIEW.md), [agent contract](maintenance/AGENT_CONTRACT.md) | 17 October review and later execution instructions. Proposed IDs become active only when dispatched in the canonical backlog. |
| [MNT-01](maintenance/agents/01-documentation.md), [MNT-02](maintenance/agents/02-task-discovery.md), [MNT-03](maintenance/agents/03-provider.md), [MNT-04](maintenance/agents/04-cli-workflow.md), [MNT-05](maintenance/agents/05-report-tooling.md) | Scoped assignments, not a second product status table. The dispatched [MNT-01 report](maintenance/reports/MNT-01.md) records its limited acceptance; later reports live beside it. |
| [Current report](../site/index.html), [history](../site/history.html) | Generated HTML. `task site:build` rebuilds both; `task site:check` checks identities and retained historical evidence. Local output does not prove live Pages deployment. |

## Current claims and evidence routes

| Claim | Source or acceptance route |
| --- | --- |
| Strict SRT/WebVTT inspection precedes inference and separate rendering preserves supported structure | [Format implementation](../crates/auralis-translation-formats/src/inspect.rs), [SRT round-trip](../crates/auralis-translation-formats/tests/srt_roundtrip.rs), [WebVTT round-trip](../crates/auralis-translation-formats/tests/vtt_roundtrip.rs), [product contract](PRODUCT_PLAN.md). |
| CLI accepts a supplied server and also owns a checked local child | [Command dispatch](../crates/auralis-translation-cli/src/command_dispatch.rs), [local server implementation](../crates/auralis-translation-cli/src/local_model_server.rs), [bounded local acceptance](../eval/experiments/2026-10-10-cli-local-runtime-result.md). |
| Durable results belong to Translate SQLite; Auralis publishes only ready managed artifacts | [Translate repository](../crates/auralis-translation-sqlite/src/repositories/), [storage contract](architecture/002-storage-and-lifecycle.md), [native result-gap recovery](../eval/experiments/2026-09-25-native-result-gap.md). |
| Current task counts come from one table; no count is a release-quality percentage | [Backlog](IMPLEMENTATION_BACKLOG.md), [plan checker](../eval/scripts/check-delivery-plan.mjs), [progress loader](../eval/scripts/delivery-progress-section.mjs). |
| Public source exists; prior local-only decision is dated | [GitHub repository](https://github.com/Ermolz69/auralis-translate), [26 September audit](../eval/experiments/2026-09-26-translation-delivery-audit.md), [28 September Pages record](../eval/experiments/2026-09-28-goal-plan-audit.md). A new Pages deployment needs its own run/live check. |
