# RELEASE-05 self-audit v14: source-fact hints rejected

Date: 9 October 2026. This extends the [v13 audit](2026-10-09-release-05-audit-attempt-v13.md)
after the bounded [source-fact-hint screen](2026-10-09-source-fact-hints-v1-result.md).
The PLAN-03 scope, original Chinese source, two complete `needs_review` SRT
drafts and production v8 profile remain unchanged. The chosen
[18:36 YouTube scene](2026-10-09-youtube-chinese-scene-selection-result.md)
has a regular Chinese track and three AI source-audio samples; no person
has confirmed speech alignment or subtitle rights.

The new screen made 36 real 7B chats and 72 successful template/tokenizer
checks. Five no-hint pairs were byte-identical to baseline requests. One
authored 9400 fact improved, but candidate cue 328 introduced a major
clock error and cue 276 leaked JSON wrapper punctuation. The existing
v7/v8 decoder rejects the latter before checkpoint. The 36-month and
thousand-person-team natural errors persisted. The candidate failed its
predeclared no-new-major rule; [catalog v49](../regressions/catalog-v49.json)
pins REG-069 and REG-070. The public machine observations and separate AI
self-review do not constitute independent human scores.

| Gates | Current decision and missing proof |
| --- | --- |
| G1–G2 | Partial: both full original-platform SRT drafts retain 467/467 mapped cues, but the fact-hint candidate was a short direct-chat screen and was rejected |
| G3–G5 | Open: no independent bilingual ratings, unresolved planning/team/future facts, new clock regression in the rejected candidate, and no accepted source-scoped term ledger |
| G6–G8 | Open: no final SLA/fault matrix or accepted consumer lineage; single copied recovery remains narrow evidence |
| G9 | Open: no clean unseeded Windows installation through a selected endpoint; desktop remains owner-deferred |
| A1–A3 | Open: no independently reviewed spoken script; prior real SAPI tests are outside an accepted final lineage |
| A4–A6 | Open: no three listened scenes, approved complete playable media or resolved distribution rights |

The source still has zero admitted release cues. Its video has a reported
CC Attribution field and an unreviewed Commons license claim; the Chinese
caption text has no separately established permission. Three 12-second
offline ASR windows show plausible speech/caption agreement with recognition
errors, but do not replace direct listening or speaker mapping. The owner
has no bilingual reviewer/listener and excluded volunteer outreach. Japanese
and subtitle-free ASR remain separate; fine-tuning or higher-precision
quantization still requires measured justification.

`task eval:source-facts:check`, `task test:long-batch-v8`,
`task eval:regression:reg069070:check` and
`task eval:regression:catalog:recent:check` passed before this audit.
`task plan:check`, `task docs:check`, `task site:build` and
`task site:check` must be rerun after this documentation change. The
GitHub Pages live-byte check must be repeated after publication.

**RELEASE-05 remains failed/open.** Keep production v8, both full drafts,
the original source and all failed raw replies unchanged. Next bound a
source-derived post-answer fact diagnostic or fail-closed review experiment
on the same natural risks with new related/negative controls, then test a
second source family before any product promotion. Human language and sound
ratings, rights, clean installation and final Auralis playback remain
separate required gates. Rollback is a fresh v8 run with an appropriate
compatible SQLite backup; never downgrade a newer database in place.
