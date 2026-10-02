# RELEASE-05 self-audit v6: natural 7B draft is structurally complete, Goal remains open

Date: 2 October 2026. Audited committed candidate
`bb4b9082bb56e91470dd3c24ea1128d07ac266d3` on the current Windows
machine. This is a **self-audit**, not an independent reviewer verdict.
Frozen [PLAN-03 scope](2026-09-28-goal-scope-v1.md),
[release criteria](../../docs/RELEASE_ACCEPTANCE.md),
[canonical backlog](../../docs/IMPLEMENTATION_BACKLOG.md) and
[regression policy](../../docs/evaluation/008-regression-and-adversarial-checks.md)
still govern. The chosen product scope includes long Chinese SRT→Russian
translation and a real Auralis dubbing pilot. The current 7B/v8 profile is
experimental; no final release model, package, source corpus or delivery
endpoint has been selected. Desktop remains owner-deferred, not completed
by the CLI. Japanese, subtitle-free ASR and training/precision upgrades
remain separate or measurement-conditional directions.

## Candidate and observed engineering result

The known-development ASUS SRT has 268 cues and SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
The complete 7B/v8 single-target `needs_review` output has SHA-256
`746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee`.
Model GGUF: `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`;
profile: `a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc`;
v8 prompt: `3e59c7dd662eb0260f12c785386ac447349cf1472cfe23b46d060a57f1c1c9d9`;
llama.cpp runtime: `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`;
release CLI: `5cc85dee7751256ddf6963ed5606bac092d54ca91c1263001bcaf22898a158b3`.
The private raw [run evidence](2026-10-02-v8-asus-single-target-result.md)
is retained under the ignored cache, report SHA-256
`9ae192177dd51611f49adf7699ca4fe9677a230dc74cbdedded2618040cc193c`.
The 7B completed 268/268 real chats and durable checkpoints in 336,757 ms
with 79,220/13,316 prompt/completion tokens. Sampled server working set
reached 5,068,574,720 bytes; sampled device-wide GPU use reached 7,284 MiB
of 8,192 MiB. Those samples are not isolated resource peaks or an SLA.
The paired 1.8B arm failed safely at cue 80, retaining 79 checkpoints and
publishing no SRT. Four-target and copied recovery attempts are retained
separately, including their failures.

## Gate disposition for this candidate

| Gate | Observed evidence | Audit disposition |
| --- | --- | --- |
| G1 structure | 268/268 IDs and timing lines checked; original hash unchanged | Partial technical pass on an unadmitted development source; release gate open |
| G2 coverage | 268/268 durable targets and one separate 7B result; 1.8B partial result not published | Partial technical pass; selected release corpus and same-candidate acceptance open |
| G3 adequacy | 0 independently reviewed eligible holdout cues; 43 source-only-selected cues had AI triage | Fail/open; 95% ≥4/5 threshold unmeasured |
| G4 critical errors | Six high-confidence AI meaning findings; no independent adjudication or closed holdout | Fail/open; zero-unresolved-critical criterion unproved |
| G5 terminology | No human-approved source-scoped term ledger for this candidate; name and technical term issues remain | Fail/open; 98% threshold unmeasured |
| G6 resources | 336,757 ms, sampled memory/GPU above; no frozen selected-hardware SLA or clean target | Fail/open |
| G7 recovery | Four-target copies preserve source and old checkpoints; selected single-target run has no full fault matrix | Fail/open |
| G8 export | Separate SRT structure verified; declared consumer behavior, lineage and offline re-export not completed for this candidate | Fail/open |
| G9 installation | No unseeded Windows target or approved final desktop endpoint | Fail/open |
| A1–A6 dubbing | Earlier 263-cue SAPI/FFplay technical pilot exists, with 256 timing overruns; this 268-cue result has no approved script, scene listening or final played media | Fail/open for every audio gate |

The [43-cue AI audit](2026-10-02-v8-asus-single-target-risk-audit-result.md)
found six source-aware semantic/term risks and four Russian-language
problems. REG-054–059 preserve minimal private reproducers and new authored
controls. The warning scanner's 54 literal digit/Latin markers include
false positives. None is a human score. Subtitle rights and spoken-Chinese
alignment are unresolved; inventory still admits 0 eligible cues. The
owner rejected volunteer contact, so no invitation was sent. Independent
bilingual review and listening remain unavailable. Clean Windows hardware
and an explicit desktop scheduling decision also remain external needs.

## Checks, publication and rollback

Observed passing commands on the candidate work:
`task check` (format, Clippy and workspace tests),
`task test:model-profiles`, `task test:long-batch-v8`,
`task eval:long:v8:asus:check`,
`task eval:long:v8:asus:resume:check`,
`task eval:long:v8:asus:single:check`,
`task eval:long:v8:asus:single:semantic:check`,
`task eval:regression:catalog:check`, `task plan:check`,
`task docs:check`, `task site:build`, `task site:check` and
`task site:live:check`. The full single-target probe command exited 1
because its paired 1.8B arm failed; its 7B arm completed, and this is
reported as `completed_with_failure`, not a passing paired quality test.
The first copy-resume launcher failed at `spawn EPERM` before inference;
the retained second launch ran the only two planned resume commands.

Git commits from `95099da` through `bb4b908` use the verified primary
global `Ermolz <00ermzahar@gmail.com>` identity for author and committer.
The unrelated working-tree change in
`docs/architecture/014-result-history-selection.md` was excluded. GitHub
Pages workflow [37052199144](https://github.com/Ermolz69/auralis-translate/actions/runs/37052199144)
succeeded. `task site:live:check` compared published current HTML
SHA-256 `3a9315953110a1899072088a1d73dcd1aa95ec1cf4eb2150efed6c4d7f5d7004`
and historical HTML SHA-256
`30439f4dc157633772ceea92e24fadf2b7ea4c40926eaa0892a1a9783c6bb5e4`
byte-for-byte with committed files. Historical measurements were retained;
the current page distinguishes full structure from language acceptance.

The prior runnable/public baseline is `d593e1a48328596d0f72ae06c52bc16ef80c983f`.
Rollback can restore that commit on a separate branch and republish its
`site/` files or revert the new commits in reverse order after review;
do not modify the retained source, SQLite states or earlier accepted
artifacts. No user database migration was performed in this slice.

**RELEASE-05 decision: failed/open.** Next local work is a bounded real
screen of REG-058's same-source controls, then a measured context/term
correction and new full natural-file run. Full Goal completion still
requires an eligible rights-and-alignment-checked source, independent
Chinese–Russian meaning assessment, an approved spoken script, real
Auralis listening/fit, a clean Windows target and the owner's desktop
decision. The user has ruled out volunteer outreach; no workaround is
claimed to replace a human acceptance score.
