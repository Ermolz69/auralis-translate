# RELEASE-05 self-audit v10: provisional terminology rejected

Date: 3 October 2026. This is a self-audit of the current Chinese-subtitle
translation and Auralis dubbing Goal, extending the
[v9 committed audit](2026-10-02-release-05-audit-attempt-v9.md).
The frozen [PLAN-03 scope](2026-09-28-goal-scope-v1.md),
[G1–G9/A1–A6 definitions](../../docs/RELEASE_ACCEPTANCE.md) and
[regression policy 008](../../docs/evaluation/008-regression-and-adversarial-checks.md)
remain unchanged. The model and product v8 profile were not edited. The
owner declined volunteers; nobody was contacted and no human assessment is
claimed. The foreign local edit to
`docs/architecture/014-result-history-selection.md` and the adjacent
Auralis working tree remain outside these commits.

## Exact new evidence and disposition

The [frozen manufacturer term plan](2026-10-02-reg-058-provisional-terms-v1-plan.md)
was committed as `c8992ef22d00d3280073ce3e68bdf3ab56f2d0c1` before a
single real-model attempt. It used 7B Q4_K_M SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
v8 manifest SHA-256
`a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc`
and Windows CUDA llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
on the measured 8,192-MiB RTX 3070. The [new result](2026-10-02-reg-058-provisional-terms-v1-result.md)
contains 20/20 structurally accepted raw chats and 40/40 template/tokenizer
preflights on ten identical authored Chinese controls. The private raw
report SHA-256 is
`dbd76bfe2214add54ab75ac34251ddb7aba8a343284d067630a7eb194778b283`;
the source-free public report SHA-256 is
`300bc148566f8e7d7cd813863feb7c4b7de2a62311d72b8851aeb43ae0c72ba6`.
Terms repaired the two known positive concepts but corrupted two correct
negatives. [REG-061](../regressions/catalog-v40.json) pins exact response
hashes, two minimal reproducers and five unrun controls. The predeclared
advancement rule failed. The experimental note is rejected, the existing
7B/v8 268-cue draft is unchanged and no new full-file run is justified.

## Required gate decisions

| Gate | Observation | Decision |
| --- | --- | --- |
| G1 | The prior natural 7B development draft preserved 268/268 mapped cues and original bytes; no selected final source/profile | Partial engineering evidence; open |
| G2 | Prior 7B has 268 durable checkpoints and separate `needs_review` SRT; 1.8B stopped at 79/268 without partial publication | Partial development evidence; open |
| G3 | 0 eligible independently reviewed holdout cues versus ≥300 and ≥95% at ≥4/5 | Open |
| G4 | Six natural AI meaning risks; new term screen introduced two material negatives; no independent adjudication | Open |
| G5 | Manufacturer forms are provisional, not an approved ledger; ≥98% applicable-term gate unmeasured | Open |
| G6 | Prior long run 336,757 ms; new small screen 23,767 ms and 7,299-MiB whole-device sampled GPU peak; no selected hardware SLA | Open |
| G7 | Development copy/resume checks exist; final same-candidate fault matrix is absent | Open |
| G8 | Development SRT structure checked; final consumer and lineage acceptance absent | Open |
| G9 | No unseeded Windows install and offline translation through final endpoint; desktop decision deferred | Open |
| A1 | No reviewed translation, approved spoken script and speaker/voice identities | Open |
| A2 | Prior real SAPI generated 263 WAVs; they are not audio for approved segments | Open |
| A3 | 256 prior cue overruns; no accepted fit, sound or mix limits | Open |
| A4 | 0 human-listened 10–20-minute scenes versus three required | Open |
| A5 | No complete natural approved-media recovery pilot | Open |
| A6 | Prior technical FFplay completion does not certify final consumer/listening/rights | Open |

The source inventory remains 12 tracks, 11 media groups, 3,280 technically
inspected slots and **zero eligible** evaluation cues. Rights, spoken
alignment, an independent Chinese–Russian rating, an approved script, a
real listener, clean Windows and the owner's deferred desktop decision remain
external prerequisites. The user has specifically excluded volunteer outreach;
no substitute human score will be invented. Higher-precision quantization or
training has no measured basis in this term-screen outcome. Japanese and
ASR without existing subtitles remain separate scopes.

## Verification and recovery

`task eval:regression:reg058:terms:preflight` checked the frozen input,
runtime, model, manifest and exact planned request hashes.
`task eval:regression:reg058:terms:report` extracted the public evidence.
`task eval:regression:reg058:terms:check` verified all 20 raw requests and
responses and 40 token preflights. `task eval:regression:catalog:check`
validated the historical chain through REG-061. After adding the finding,
`task eval:regression:check` completed with exit 0. `task check` passed Rust
formatting, Clippy and all workspace tests. `task docs:check`,
`task plan:check`, `task site:build` and `task site:check` passed. The site
build regenerated only the two public HTML files: the current page with the
new failed term screen and the existing history with prior measurements.
Publication observations are recorded in the addendum below.

The previous verified runnable baseline remains
`cc4c345680f52d4b6a8cfcc934332a4d63f290e7` (restore in an isolated
checkout, preserving user databases and media). For this experiment, use
product v8 unchanged; remove the new evaluation/site commits only through
an isolated Git revert or checkout after reviewing later commits. Do not
rewrite immutable raw reports or original media.

**Decision: RELEASE-05 failed/open.** Next bounded engineering step is
target-scoped terminology isolation with the five new REG-061 controls, then
an independently frozen full-file development comparison only after a
positive/negative screen passes. No new Auralis spoken pilot can be accepted
until source, translation and script admission; independent source and audio
work can continue without contacting volunteers.

## Publication addendum

The evidence/result commit `64ea177` and site commit
`2de0609bbb473e64131d29d9de074a44d0e7736a` are on `main` and
`origin/main`. Author and committer of the three new commits use the checked
primary global identity `Ermolz <00ermzahar@gmail.com>`. The
[Pages workflow](https://github.com/Ermolz69/auralis-translate/actions/runs/37065254162)
completed successfully. `task site:live:check` returned HTTP 200 and exact
local/live byte equality for the
[current report](https://ermolz69.github.io/auralis-translate/?revision=2de0609bbb473e64131d29d9de074a44d0e7736a):
56,568 bytes, SHA-256
`917d8d6d720869c8bb95cb10d14290bb1519e786af3afb1a55dc07a803e64abd`;
and [history](https://ermolz69.github.io/auralis-translate/history.html?revision=2de0609bbb473e64131d29d9de074a44d0e7736a):
1,132,560 bytes, SHA-256
`4f4d485a4299ed4f6419f1a015fe5ac42522889feb0bc5214bda0d1ac6bf8e14`.
The private live-check report SHA-256 is
`f78ff1b05fa261ecd508ad0a2d440753c6a99ed6334fb96de1073fffb108fa70`.
The historical measurements remain in their separate page; the history rebuild
updated the embedded backlog identity and did not discard prior measurements.
This publication does not change the failed/open RELEASE-05 decision.
