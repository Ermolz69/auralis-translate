# RELEASE-05 self-audit v7: paired semantic controls do not close quality gates

Date: 2 October 2026. Candidate commit audited:
`1b5e96e8e49b424e76b3ef5aa85d1e77c252f3fb` on `main`. The only
working-tree modification outside this audit is the owner's unrelated
`docs/architecture/014-result-history-selection.md`; it is excluded.
This is a **self-audit**. No independent bilingual reviewer or listener
participated. The owner explicitly declined volunteer contact; no outreach
was sent. The frozen [PLAN-03 scope](2026-09-28-goal-scope-v1.md),
[release criteria](../../docs/RELEASE_ACCEPTANCE.md),
[backlog](../../docs/IMPLEMENTATION_BACKLOG.md) and
[regression policy 008](../../docs/evaluation/008-regression-and-adversarial-checks.md)
remain unchanged. Chinese SRT→Russian and the real Auralis dubbing pilot
are required; Japanese and subtitle-free ASR are separate. Desktop is
owner-deferred, not completed by the CLI. Training and precision changes
remain measurement-conditional.

## Same-candidate evidence

The private natural ASUS development SRT has 268 cues, SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
The experimental 7B/v8 single-target run completed 268/268 chats and
durable checkpoints with separate `needs_review` SRT SHA-256
`746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee`.
The matching 1.8B arm retained 79 checkpoints and rejected cue 80 without
publishing a partial SRT. The full 7B run used 79,220 prompt and 13,316
completion tokens in 336,757 ms; sampled server working set reached
5,068,574,720 bytes and device-wide GPU reached 7,284/8,192 MiB.
Model GGUF SHA-256 `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
profile `a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc`,
v8 prompt `3e59c7dd662eb0260f12c785386ac447349cf1472cfe23b46d060a57f1c1c9d9`,
llama.cpp runtime `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
release CLI `5cc85dee7751256ddf6963ed5606bac092d54ca91c1263001bcaf22898a158b3`.
The private [full-run record](2026-10-02-v8-asus-single-target-result.md)
has SHA-256 `9ae192177dd51611f49adf7699ca4fe9677a230dc74cbdedded2618040cc193c`.
No final model, package, SLA or delivery endpoint is selected.

The source-only-selected [AI audit](2026-10-02-v8-asus-single-target-risk-audit-result.md)
read 43/268 cues and identified six high-confidence meaning/term risks
and four Russian-language defects. The [REG-058 paired control screen](2026-10-02-reg-058-paired-controls-result.md)
then tested six authored positive and six negative cases on each model.
Its first attempt is explicitly invalid: all 24 prompts changed only
`source_original`, leaving the natural `source_for_translation`. Private
invalid report SHA-256 `d9a9229940e9474ab6cc75a25819300ac5bd7a76bde4fcbe8114196faf4eade2`.
REG-060 reproduces the harness defect and verifies 24 corrected requests.
The fresh v2 attempt used 24 real chats, 48 rendered/tokenized preflights,
6,640 prompt and 985 completion tokens across the two arms in 28,118 ms;
private report SHA-256
`a855c4d3d00aae4281ed5fa5d3b1f6b61b8e8ab600dda25f9eee9f100f6c126b`.
The [source-free public report](../reports/2026-10-02-reg-058-paired-controls-v2.json)
has SHA-256 `0559b53a22ce19f0392ac58155f723a36c3649fc2a89fbefca167af0170a566b`.
Exact prompt reconstruction checks both target fields and all unchanged
context/parameters. AI reading found 7B multi-core→multithread and
mouse-pad→stand changes, plus a leaked JSON suffix in the platform cue;
1.8B had handheld/tablet and chart-axis errors. The 7B leak is rejected
by the existing provider guard in a new exact-candidate regression test.
These are one-sample development observations, not a blinded population
score; human review remains zero. The retained v1 output contributes
no semantic comparison.

## Gate disposition

| Gate | Observed result and gap | Decision |
| --- | --- | --- |
| G1 structure | 268/268 IDs and timing checked on an unadmitted development source; original hash unchanged | Partial technical pass; release open |
| G2 coverage | 268/268 durable 7B targets and one separate `needs_review` SRT; same final corpus/model not selected | Partial technical pass; release open |
| G3 adequacy | 0 independently reviewed eligible holdout cues; 43 source-selected AI readings and 12 authored controls per model | Fail/open; 95% ≥4/5 threshold unmeasured |
| G4 critical errors | Six natural-draft AI meaning findings; corrected controls confirm additional risk, without independent adjudication | Fail/open; zero-unresolved-critical criterion unproved |
| G5 terminology | Technical terms and mouse-pad meaning fail in current 7B controls; no human-approved source-scoped ledger for this candidate | Fail/open; 98% threshold unmeasured |
| G6 resources | 336,757 ms and sampled memory/GPU for 7B; no frozen selected-hardware SLA or clean target | Fail/open |
| G7 recovery | Prior four-target copy resumes were measured; no same-candidate single-target fault matrix | Fail/open |
| G8 export | Separate SRT structure checked; consumer behavior, full lineage and offline re-export not accepted for final candidate | Fail/open |
| G9 installation | No unseeded Windows target or approved final endpoint | Fail/open |
| A1–A6 dubbing | Prior real 263-WAV SAPI/FFplay technical pilot has 256 timing overruns; this 268-cue result lacks an approved script, three listened scenes and final played media | All fail/open |

Source rights and spoken-Chinese alignment remain unresolved: inventory
admits 0 eligible cues. No independent bilingual reviewer, audio listener
or clean Windows target is available. The current machine supports
engineering experiments but cannot establish those missing gates. The
owner must separately decide whether to schedule the deferred desktop
release slice. No change to G3/G4/A4 thresholds or substitute AI score
was made.

## Checks, publication and rollback

Observed passes on this candidate: `task test:long-batch-v8` (including
the exact leaked-tail control), `task eval:regression:reg058:check`,
`task eval:regression:reg058:v2:preflight`,
`task eval:regression:reg058:v2:check`,
`task eval:regression:reg060:check`,
`task eval:regression:catalog:check`, `task check` (format, Clippy and
workspace tests), `task docs:check`, `task plan:check`,
`task site:build`, `task site:check` and `task site:live:check`.
The v1 semantic screen was **invalid**, despite completing 24 model
calls; no new model runs were silently added. v2 was run once without
retry. The historical full 1.8B/7B command remained
`completed_with_failure` because 1.8B stopped. All raw failures persist.

The verified primary global identity is
`Ermolz <00ermzahar@gmail.com>` for both author and committer of
`3f7ce11` and `1b5e96e`. The unrelated architecture edit was not
staged. GitHub Pages workflow
[37055231418](https://github.com/Ermolz69/auralis-translate/actions/runs/37055231418)
succeeded for `1b5e96e`. `task site:live:check` returned byte-identical
current HTML SHA-256
`909dd2276e5e647af48ec8639e9966e268cd3af5661c6e1cf6f19ad33b2da0de`
and historical HTML SHA-256
`599ba1808cf3ec3af58a158baa833c47e8f8939436620ee43ce7fde74bb9ca74`.
Historical measurements remain in `history.html`; the current page
shows the corrected control result and its failed precursor. The
previous runnable/public baseline is
`57c5d6f27b9e37231aa9c321fde416530b71c32f`.
Rollback can restore that commit on a separate branch and republish
its `site/` files, or revert `1b5e96e` and `3f7ce11` in reverse order
after review. Retained source files, prior SQLite states and accepted
results must not be changed. No user database migration occurred.

**RELEASE-05 decision: failed/open.** Next independent work is a frozen
source-scoped semantic/term correction measured on the confirmed cases,
then another full long-file run and source-only-selected audit including
seams, start/middle/end, names, amounts, negation and scene continuity.
Full Goal completion still needs an admitted source, independent
Chinese–Russian meaning assessment, an approved spoken script, real
Auralis listening/fit, a clean Windows target and the owner's desktop
scheduling decision. The rejected volunteer route is excluded.
