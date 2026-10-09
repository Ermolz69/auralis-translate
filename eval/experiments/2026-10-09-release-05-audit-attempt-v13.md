# RELEASE-05 self-audit v13: cue shifts cannot be promoted

Date: 9 October 2026. This extends the [v12 audit](2026-10-09-release-05-audit-attempt-v12.md)
after the frozen [REG-066 natural seam screen](2026-10-09-reg066-natural-seams-result.md).
The PLAN-03 scope, G1–G9/A1–A6 acceptance thresholds, source, original
467-cue drafts and v8 product profile remain unchanged. Both models answered
all 30 planned requests; 60 prompt/template token checks passed. The
two four-target final-window replies dropped cue 467 and were rejected.
The separate AI source-aware review found one 7B cue-328 time repair and
one new 1.8B mixed-script occurrence, while other natural fact errors
persisted. The exact failures are frozen in [catalog v48](../regressions/catalog-v48.json).
This is development evidence, not an independent language score.

| Gates | Current decision and missing proof |
| --- | --- |
| G1–G2 | Partial: two structurally complete 467-cue `needs_review` SRT drafts; the new shifted responses are not a full candidate |
| G3–G5 | Open: zero independent bilingual reviews, unresolved natural critical facts, no accepted terminology or held-out adequacy rate |
| G6–G8 | Open: no final SLA/fault matrix or accepted consumer lineage; copied recovery is only narrow evidence |
| G9 | Open: no clean unseeded Windows installation through a selected endpoint; desktop remains owner-deferred |
| A1–A3 | Open: no reviewed spoken script; earlier real TTS is outside accepted final lineage and fit gates |
| A4–A6 | Open: no three listened scenes, approved complete media or rights-cleared delivery |

The original-platform Chinese SRT and matching media remain technical
development sources with zero admitted release cues. Rights and manual
speech/caption alignment are unresolved. No bilingual reviewer or audio
listener is available, and the owner excluded volunteers. The 36-second
ASR triage does not replace direct listening. Fine-tuning or higher-precision
quantization still requires measured justification; Japanese and
no-subtitle ASR remain separate.

`task eval:regression:reg067068:check` and
`task eval:regression:catalog:recent:check` passed with the complete raw
seam evidence and old catalogs. `task plan:check`, `task docs:check`,
`task site:build` and `task site:check` passed on this candidate. The
GitHub Pages live-byte check must be repeated after deploy.

**RELEASE-05 remains failed/open.** The blanket cue shift is rejected; keep
v8 and both old SRT drafts without editing. Next freeze a source-derived
typed-fact guard with no-new-major-error, no dropped-ID and no cross-cue
leakage rules before spending another model budget. Human review and real
Auralis listening remain separate gates. Rollback is the unchanged v8
profile and a fresh isolated run, retaining the historical outputs and a
compatible SQLite backup; never downgrade a newer database in place.
