# RELEASE-05 interim self-audit: second restaurant 7B format failure

Date: 1 October 2026. This is an incomplete audit after the
[copied 7B continuation](2026-10-01-sethlui-7b-copy-resume-failure.md),
not final `RELEASE-05` acceptance. The [previous audit](2026-10-01-release-readiness-after-restaurant-model-screen.md)
and all earlier measurements remain. The frozen [PLAN-03 scope](2026-09-28-goal-scope-v1.md)
still requires G1–G9 and A1–A6 for a selected Chinese-to-Russian subtitle
and real Auralis audio deliverable. Japanese and subtitle-free ASR remain
separate. Desktop is owner-deferred; training and higher precision are
conditional on measured need.

The copied 7B v6 run preserved the original 61 checkpoints and advanced to
99 of 263. A second raw JSON-wrapper suffix at cue 100 was rejected by the
existing grammar guard. The original SQLite/SHM/WAL hashes are unchanged;
the copied state has no complete result or partial Russian SRT. `REG-042`
pins the new real reproducer and related/negative controls. The one-attempt
continuation budget is exhausted. 1.8B still has one complete structural
candidate with known meaning defects; neither arm is selected. No human
Chinese-Russian or listening score was added.

| Gate | Current disposition |
| --- | --- |
| G1–G2 | Partial engineering evidence only: 1.8B exported 263 cues, 7B has two rejected incomplete attempts. No selected release candidate. |
| G3–G5 | Open: 0 eligible cues and 0 independent bilingual ratings; known 1.8B name/category/neighbor errors, no approved term denominator. |
| G6–G9 | Open: no selected measured SLA, complete final-candidate recovery matrix, target-consumer validation or unseeded Windows install. |
| A1–A3 | Open: prior real SAPI technical drafts lack an approved script and accepted fit. No real Auralis restaurant dub can claim lineage from an unreviewed translation. |
| A4–A6 | Open: 0 listeners, no three approved 10–20-minute scenes, full audio recovery or accepted media playback/rights evidence. |

`task eval:natural:sethlui:v6:7b:resume:preflight`,
`task eval:natural:sethlui:v6:7b:resume` (expected nonzero result at cue 100),
`task eval:natural:sethlui:v6:7b:resume:result:check`,
`task eval:regression:catalog:check` and `task test:srt-checkpoint-guard`
were executed. The result checker reconciles 39 raw requests, token counts,
99 copied checkpoints, zero result rows and original state hashes. The
original source and rights review remain unchanged. A full structural 7B
artifact would need a new versioned reliability strategy, then independent
language review. Human source/media rights and speech alignment, bilingual
reviewers/listeners, and an unseeded Windows target remain concrete external
prerequisites. The desktop stage remains deferred until the owner's explicit
scheduling decision.
