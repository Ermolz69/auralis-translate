# MNT-01 documentation acceptance report

Status: implementation ready for independent review; canonical row remains
`in_progress` until the reviewer verifies this scoped acceptance. This is
documentation maintenance, not a language, model, audio, native desktop or
release acceptance.

## Identity and scope

- Repository: `auralis-translate`; branch: `docs/translate-current-documentation`.
- Repository starting HEAD: `5749fb72b43569c313410fb1422892272e852432`.
- Frozen MNT-01 base with the supplied planning packet:
  `7e2140620887fd94c9066901209629217e2138f0`, tree
  `79b53113bf3d39954ccb58f6204c441b1a10f427`.
- Tested documentation/progress candidate HEAD:
  `32338aff0b1d76eaafdf595cc1cc03f56dd444bc`; source tree:
  `6923dc560f6931c0f597d98360556e27c09f5996`. This report and its
  backlog link follow as a report-only publication commit; the final commit
  identity is recorded in the handoff after creation.
- No Rust/runtime/model/profile/manifest/schema/API/protocol/config change.
  Public CLI commands, error behavior, source preservation and release
  thresholds are unchanged.

## Problem, ownership and changed paths

The root README contradicted later public-source evidence. The 26 September
integration description omitted the implemented CLI-owned server. The status
page opened with a 49-task historical count, while the current backlog had 58
before dispatch. The delivery plan's desktop deferral predated later owner
scope decisions. New readers had to follow experiment chronology to find a
model-free first check or the real crate map.

The final responsibility map is [documented here](../../DOCUMENT_MAP.md):
`AGENTS.md` and the English product/release contracts govern behavior;
`IMPLEMENTATION_BACKLOG.md` owns live task states; dated status/evaluation
records retain historical evidence; `site/index.html` and `site/history.html`
are generated projections. The [developer guide](../../DEVELOPER_GUIDE.md)
and [actual crate map](../../architecture/004-rust-code-architecture.md) are
navigation, not new product contracts.

Handwritten paths: `README.md`, `docs/README.md`, `docs/DEVELOPER_GUIDE.md`,
`docs/DOCUMENT_MAP.md`, `docs/PRODUCT_PLAN.md`, `docs/DELIVERY_PLAN.md`,
`docs/IMPLEMENTATION_STATUS.md`, `docs/REMAINING_WORK.md`,
`docs/IMPLEMENTATION_BACKLOG.md`, `docs/architecture/003-auralis-integration.md`,
`docs/architecture/004-rust-code-architecture.md`, this report and one
progress-prefix entry in `eval/scripts/delivery-progress-section.mjs`.
Generated paths: `site/index.html`, `site/history.html`.

## Before and after claims

| Before | After and grounding |
| --- | --- |
| README said no public remote existed. | [Public GitHub repository](https://github.com/Ermolz69/auralis-translate) observed 17 October 2026; [26 September audit](../../../eval/experiments/2026-09-26-translation-delivery-audit.md) remains a dated local-only decision. [28 September Pages record](../../../eval/experiments/2026-09-28-goal-plan-audit.md) reports that deployment; no new live deployment is inferred. |
| Integration text said CLI runtime ownership remained work. | [Dispatch](../../../crates/auralis-translation-cli/src/command_dispatch.rs), [owned process](../../../crates/auralis-translation-cli/src/local_model_server.rs) and [bounded acceptance](../../../eval/experiments/2026-10-10-cli-local-runtime-result.md) show both caller-supplied and CLI-owned paths. Upgrade/removal/clean installation remain open. |
| Status led with 49 tasks as though current. | 49 is labelled the 28 September audit; `task plan:check` computes the present table count. MNT-01 adds one `in_progress` row and a progress phase without changing release gates. |
| Delivery plan deferred desktop work without later context. | The original schedule is dated and linked to [translator-only v3](../../../eval/experiments/2026-10-10-translation-only-scope-v3.md) and [desktop v3](../../../eval/experiments/2026-10-10-translate-desktop-goal-scope-v3.md). Both retain G1–G9. |
| Architecture example looked like a current file tree. | [Current read path](../../architecture/004-rust-code-architecture.md) links actual core, format, SQLite, provider, CLI and evaluation modules; the example is labelled historical. |
| Root onboarding required chronology and used placeholders for the first check. | [Guide](../../DEVELOPER_GUIDE.md) names prerequisites, a repository fixture, model-free commands, inference ownership, resume/diagnostics and contribution rules. The CLI fixture check is run below. |

The [explicit inventory](../../DOCUMENT_MAP.md) covers current entrypoints,
architecture, evaluation/reference contracts, the maintenance packet and
generated output. It links each active English `docs/` file. Historical
experiments and model manifests were not rewritten. The Russian root plan and
Auralis checkout were not edited.

## Commits and review size

| Commit | Purpose | Ordinary added/deleted | Rename-aware added/deleted |
| --- | --- | --- | --- |
| `7e2140620887fd94c9066901209629217e2138f0` | Preserve supplied review and assignments as the frozen implementation base. | 450/0 | 450/0 |
| `bf31c7ed63631aad20ca2c94ac0b553c4c33c5fd` | Onboarding guide, document inventory and current reader paths. | 211/13 | 211/13 |
| `32338aff0b1d76eaafdf595cc1cc03f56dd444bc` | Contract/status reconciliation, MNT progress phase and coherently regenerated site pages. | 133/38 | 133/38 |
| `7af849c3c9d5fc2c719bfe1dae06f73b9c692e23` | Add this acceptance record and link it from canonical progress. | 119/2 | 119/2 |

The generated HTML has two changed long lines per page in the ordinary diff;
that is generated identity/progress churn rather than handwritten refactoring.
`site/history.html` now carries the MNT-01 row and 59-task count. Both pages
refresh hashes for changed plan documents. `task site:check` retained the
historical evidence and failure boundary, including REG-011. No old experiment
file or model response was changed.

## Verification and retained limits

Baseline on the packet base: `task docs:check` passed (557 Markdown files),
`task plan:check` passed (58 tasks, six document identities), `task site:build`
passed (both HTML files built), and `task site:check` passed. The baseline
build produced only working-tree line-ending flags for generated HTML; the Git
content diff was empty.

Final checks from the isolated worktree on the tested candidate plus this
report draft (all exit 0):

| Command | Observed result |
| --- | --- |
| `task cli -- inspect crates/auralis-translation-formats/tests/fixtures/plain.srt` | Compiled offline and reported `format=srt cues=2`, expected IDs/text slots and protected byte ranges; no inference. |
| `task docs:check` | 560 Markdown files with valid local file links. |
| `task plan:check` | 59 unique tasks, valid states/dependencies, six document identities. |
| `task site:build` | Rebuilt `site/history.html` (1,198,285 bytes) and `site/index.html` (120,342 bytes) from frozen evidence. |
| `task site:check` | Passed script, source-evidence, slot-schema and voice-metadata checks; verified both HTML pages and the two-file boundary. |

`task docs:check` does not validate anchors or
external URLs. `task plan:check` validates task accounting, not product quality.
`task site:check` validates local evidence and HTML boundaries, not a Pages
deployment. The public repository was observed through GitHub; the Pages URL
was not independently reachable through the available web reader during this
slice, so only the dated deployment record is claimed. No real model, download,
native app, clean install or language review was run.

MNT-02 has not supplied new maintenance Taskfile wrappers. The final command
documentation and source map must be reconciled after accepted MNT-02–MNT-05
branches. The receiving reviewer must compare the full diff and rerun the
scoped checks on the committed tree. MNT-01 cannot be marked `done` before
that review and its final integration pass.

The branch was pushed to the verified `origin` as
`docs/translate-current-documentation` after committed-tree checks. No PR was
opened. The final remote tip and this report's own publication commit are
identified in the handoff rather than guessed inside this file.
The next integration action is independent review of the committed MNT-01
branch, followed by documentation reconciliation after accepted Translate
maintenance branches.
