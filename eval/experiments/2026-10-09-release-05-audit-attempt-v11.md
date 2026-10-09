# RELEASE-05 self-audit v11: both full drafts remain unapproved

Date: 9 October 2026. This is an interim self-audit of committed candidate
`dcd7dda` against the frozen [PLAN-03 scope](2026-09-28-goal-scope-v1.md),
[release acceptance](../../docs/RELEASE_ACCEPTANCE.md) and
[regression policy 008](../../docs/evaluation/008-regression-and-adversarial-checks.md).
The selected scope remains Chinese SRT to Russian on this Windows machine,
followed by real Auralis dubbing. Japanese, no-subtitle ASR and desktop UI
remain separate or owner-deferred. Model adaptation and higher precision
remain conditional on measured errors and resources.

## Candidate and evidence identity

The 18:36 Vivo/MediaTek source uses original-platform Chinese SRT SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`
and matched technical media SHA-256
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
The 7B v8 Q4_K_M model SHA-256 is
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`;
the 1.8B model SHA-256 is
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
The llama-server SHA-256 is
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
Each arm's manifest, prompt, request, CLI, source and output identity is in the
[original pair](../reports/2026-10-09-v8-vivo-original-long.json) and
[copy recovery](../reports/2026-10-09-reg065-vivo-copy-recovery.json).

The first 1.8B run stopped after 112/467 cues and did not publish a partial
result. A narrow provider change passed deterministic controls; a single
committed-binary resume on a **copy** then reached 467/467. The old failed
state and raw response remain unchanged. The 7B arm reached 467/467 in its
first run and re-exported byte-identically from a copied database without a
model server. Both SRTs are `needs_review`. The fresh 1.8B reply at cue 113
did not contain the original terminal LF, so the natural completion is not
isolated proof that normalization caused the improvement.

[REG-065](../regressions/reg-065-vivo-v8-terminal-line-break-v1.json) pins
the reliability failure; [REG-066](../regressions/reg-066-vivo-v8-cross-model-facts-v1.json)
pins five exact paired source-fact/language risks and ten pending controls.
Source-aware AI triage found 36-month lead, team-size/action, 1–2 a.m. and
future-product modality errors. There is no independent Chinese-Russian
adjudication, and neither model is selected for release.

## Gate disposition for one final candidate

| Gate | Observed evidence | Decision |
| --- | --- | --- |
| G1 | 467/467 original Chinese cue IDs, timing and separate Russian outputs structurally checked on two development arms | Partial; final admitted source and candidate absent |
| G2 | Each development arm has a complete result after recovery; failed original 1.8B run has no partial SRT | Partial; no final accepted artifact |
| G3 | Zero eligible independent holdout ratings versus required ≥300 cues and ≥95% at ≥4/5 | Open |
| G4 | Paired source-aware AI risks remain; zero human-adjudicated critical-error count | Open |
| G5 | Approved term/name ledger and ≥98% applicable match score absent | Open |
| G6 | Real elapsed time and sampled memory recorded, no frozen selected-hardware SLA or complete cancellation matrix | Open |
| G7 | One copy recovery and old-state immutability checked, final fault/upgrade matrix absent | Open |
| G8 | 7B offline re-export checked; selected final consumer and lineage not accepted | Open |
| G9 | No clean unseeded Windows install/offline final endpoint; desktop decision deferred | Open |
| A1 | Neither draft reviewed or made an approved spoken script | Open |
| A2 | Earlier real SAPI WAV pilots use unapproved translation, not this source's approved segments | Open |
| A3 | Earlier fit failures remain; no measured accepted script/sound/mix limits | Open |
| A4 | Zero independently listened 10–20-minute scenes versus three required | Open |
| A5 | No full natural approved-media translation-and-audio restart pilot | Open |
| A6 | Earlier technical playback is not final reviewed/rights-cleared consumer delivery | Open |

The source has zero eligible release cues because caption/audio rights and
human alignment are unresolved. The owner has excluded volunteers; no
external reviewer or listener is available. ASR on 36 seconds is only a
machine triage. Running a TTS engine now could provide a technical pilot,
but would not approve this spoken script or close A1–A6. A clean Windows
machine and the desktop scheduling decision remain future external needs.

## Checks, decision and rollback

`task test:long-batch-v7` and `task test:long-batch-v8` passed after the
provider change. `task fmt` and `task lint` passed on the changed Rust code.
`task eval:long:v8:vivo:check`,
`task eval:regression:reg065:recovery:check`,
`task eval:regression:reg065:check`,
`task eval:regression:reg066:check`,
`task eval:regression:catalog:recent:check`, `task plan:check`,
`task docs:check`, `task site:build` and `task site:check` passed. Three
private archival checks remain unavailable in the isolated checkout; the
affected recent catalogs v41–v46 were checked. The Pages live-byte check is
recorded separately after deployment.

**RELEASE-05 fails.** Keep v8 as a development baseline with no selected
model. For runtime rollback, use the previous v8 binary/profile in a fresh
run and keep the v10 SQLite backup before opening it with an older binary;
do not downgrade the newer database in place. Revert only these scoped
commits in an isolated checkout if necessary, preserving the original SRT,
all raw reports and historical Pages measurements. Next executable work is
the frozen REG-066 related/negative model screen, followed by source rights,
speech alignment and a reviewed candidate before an Auralis dubbing pilot.
