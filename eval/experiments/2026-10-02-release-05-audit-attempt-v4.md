# RELEASE-05 committed-candidate self-audit 4: release withheld

Date: 2 October 2026. Audited Translate `main` commit
`73257ef1e6e97de9c9b1279ca045f5c6e998515e` against the frozen
[PLAN-03 scope](2026-09-28-goal-scope-v1.md), the
[G1–G9/A1–A6 criteria](../../docs/RELEASE_ACCEPTANCE.md), and the
[canonical backlog](../../docs/IMPLEMENTATION_BACKLOG.md). This is a
self-audit, not an independent language or audio review. The earlier
[attempt 3](2026-10-02-release-05-audit-attempt-v3.md) and all failed
experiments remain available. No threshold or selected source changed.

The local Auralis `feat/real-tts-pilot` worktree has committed engineering
evidence at `02eed750d64cf6d2fcce8df17cd1634fe5d34269`; that branch is
not a released or pushed Auralis candidate. The model SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`
and v6 manifest SHA-256
`268c4d00eee8994936d7019d4cad47a5193a01e459ad9ed4214ea30facd102f9`
identify the measured 7B experiment, not a final package. No final package
hash or frozen end-to-end SLA exists. Author and committer of both new scoped
commits are `Ermolz <00ermzahar@gmail.com>`; the unrelated Translate
`docs/architecture/014-result-history-selection.md` edit is unstaged and
excluded.

## Gate ledger

| Gate | Current observation | Decision |
| --- | --- | --- |
| G1–G2 | The 263-cue restaurant draft is structurally complete and checkpointed; original bytes and failed attempts remain. | Partial engineering evidence. Its source and translation are not admitted or approved release inputs. |
| G3–G5 | [Corrected source inventory](2026-10-02-cross-inventory-leakage-guard-result.md): 11 tracks, 10 media groups, 3,243 inspected cue slots, **zero eligible**. Independent Chinese–Russian ratings and approved term ledgers: zero. AI triage retains the restaurant role/name defect `REG-044`. | Fail. No valid 95% adequacy, zero-critical-error or 98% term denominator. |
| G6–G8 | The measured 7B restaurant run used 308,207 ms, 71,212 input and 10,259 output tokens; recovery and offline re-export have narrower checks. | Open. Selected full-source SLA, consumer matrix and declared fault matrix are incomplete. |
| G9 | No clean unseeded Windows installation through the selected delivery endpoint. Desktop work remains owner-deferred. | Fail; CLI completion cannot close installation. |
| A1–A3 | 263/263 real SAPI WAVs were decoded; the private 738,056-ms restaurant MKV exists. Original windows have 256 overruns and 236 overlapping starts. The new [packet-boundary check](2026-10-02-sethlui-packet-boundary-result.md) passed 36,904 packets with at most 1-ms internal gap, 7-ms preroll and 1-ms tail overshoot. | Fail on approved lineage, fit and unreviewed speech; packet continuity is only one technical control. |
| A4–A6 | Earlier whole-media decode and FFplay process completed; six paired clips cover 49 distinct cues. There are zero listener forms, zero approved scenes and no established source-speech alignment or rights. | Fail. Playback-process completion does not prove perceptual quality. |

## Exact checks and publication

For the changed Translate plan and report, `task plan:check`, `task
docs:check`, `task site:build`, `task site:check` and `task site:live:check`
passed. [Pages run 37022913502](https://github.com/Ermolz69/auralis-translate/actions/runs/37022913502)
deployed this exact commit. The current
[`index.html`](https://ermolz69.github.io/auralis-translate/?revision=73257ef1e6e97de9c9b1279ca045f5c6e998515e)
was byte-identical at 29,653 bytes, SHA-256
`f78af7ec3623f844be8d3a9c9d14897f4a6ae8f4805ecf7148e6abf807a9ed79`;
[`history.html`](https://ermolz69.github.io/auralis-translate/history.html?revision=73257ef1e6e97de9c9b1279ca045f5c6e998515e)
was byte-identical at 1,126,987 bytes, SHA-256
`a06ccd4686c9ed2d26c97e8e088db866cb770f4b3cdea3b4e22f34ca7ea488d0`.
The previous measurements remain in history. The local Auralis
`task voice:natural:sethlui:media:packet:check` and `task docs:check` passed;
the broad Auralis docs lint and format checks still have pre-existing findings
recorded in the packet-boundary result. No model, TTS or playback was rerun
for this report-only change.

## Open defects and recovery

The owner declined volunteer outreach; no invitation was sent. This leaves
the independent bilingual reviewer, critical-error adjudicator and audio
listeners unavailable. A suitable Chinese-speech source with verified
subtitle/media rights and alignment, a clean unseeded Windows target, and
the later desktop decision are also missing. AI inspection and automated
tests remain explicitly separate from human judgments. No training or
higher-precision quantization has been justified by a measured, reviewed
residual-error case. Japanese and subtitle-free ASR remain separate scopes.

**RELEASE-05 fails and remains planned. The Goal is incomplete.** The next
independent work is source-rights/alignment screening and bounded translation
and speech engineering under the existing task plans. For report rollback,
restore a previous verified Translate report commit on a new branch and
republish; preserve the immutable source files, raw failures, accepted
checkpoints, historical report, local Auralis branch and unrelated edit.
