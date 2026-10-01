# RELEASE-05 interim self-audit: original track and CLI provenance

Date: 1 October 2026. This is an incomplete self-audit following the
[previous restaurant recovery audit](2026-10-01-release-readiness-after-sethlui-resume.md).
The frozen [PLAN-03 scope](2026-09-28-goal-scope-v1.md) is unchanged. No
release candidate or approved spoken script is selected.

The direct YouTube Chinese SRT is byte-identical to the 271-cue Commons copy
apart from two final LF bytes. The eight late cues therefore originated in
the YouTube track. The 263-cue derivative remains a technical candidate only.
The video metadata explicitly reports a CC Attribution license claim, but
subtitle authorship/rights, source speech alignment and public derived-audio
rights still need review. No source is newly eligible: ten candidates, 2,113
inspected cues, zero eligible cues. The [original-track result](2026-10-01-sethlui-youtube-caption-result.md)
retains exact hashes without publishing source bytes.

The [CLI provenance audit](2026-10-01-sethlui-cli-provenance-audit.md) narrows
the two 7B failure claims to the SRT grammar guard. The historical executable
cannot be credited with the later provider-level JSON-tail guard. Current
source tests include the real suffix shapes, and a fresh build has a distinct
SHA; no new natural-file inference ran. Original failure reports remain intact.

| Gate | Observed state and missing acceptance |
| --- | --- |
| G1–G2 | One unreviewed 263-cue 1.8B structural SRT; 7B stopped twice, with no output. No selected final candidate. |
| G3–G5 | Zero eligible cues and zero independent Chinese–Russian ratings; known name, category and neighbor-content errors. |
| G6–G9 | No final measured SLA, full recovery/consumer matrix, clean unseeded Windows target or authorized desktop release decision. |
| A1–A3 | Real SAPI engineering drafts exist; no approved translation/script or accepted timing fit. |
| A4–A6 | Zero human listeners and no three approved 10–20-minute scenes; no accepted full-media playback/rights decision. |

`task eval:data:youtube:sethlui:caption:check`, `task test:context-v6`,
`task build:release`, `task eval:cli:build:receipt` (after retaining and fixing
its first sandbox `EPERM` failure), `task site:build`,
`task site:check`, `task docs:check`
and `task plan:check` are the relevant local checks for this slice. Their
results are recorded at execution, not inferred from this plan. Final
`RELEASE-05` remains open. Independent bilingual review, human source/audio
listening, subtitle and derived-audio rights evidence, and an unseeded Windows
installation target remain external prerequisites; desktop stays owner-deferred.
