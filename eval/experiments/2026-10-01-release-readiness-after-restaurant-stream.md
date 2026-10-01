# RELEASE-05 interim self-audit: measured restaurant stream

Date: 1 October 2026. This is an incomplete self-audit after the
[restaurant stream inspection](2026-10-01-sethlui-stream-derivative-result.md),
not final `RELEASE-05` acceptance. It follows the
[previous self-audit](2026-10-01-release-readiness-after-source-admission.md)
without replacing its evidence. The frozen
[PLAN-03 scope](2026-09-28-goal-scope-v1.md) and release thresholds did not
change. Japanese and subtitle-free ASR remain separate; training and higher
precision remain conditional; desktop remains owner-deferred.

The new source is a 12:18.056 VP9/Opus Commons copy with a 263-cue strict
Chinese SRT derivative. The immutable 271-cue original and the eight excluded
out-of-media cues remain available privately. Ten registered sources now hold
2,113 **technical candidate** cues and **zero eligible** development or
holdout cues. No independent Chinese-to-Russian reference, speech-alignment
review or rights approval exists for the new source. The source-copy check,
strict CLI parse, measured stream containment and `REG-039` pass; these
observations say nothing about Russian adequacy or audio quality.
The [beginning/middle/end source-audio packet](2026-10-01-sethlui-audio-windows-result.md)
contains three decoded WAVs linked to cue IDs by timestamps, with zero human
listeners. Decoding does not verify spoken language or alignment.

| Gate | Current observation and missing acceptance |
| --- | --- |
| G1–G2 | Strict source parsing and mapping passed for the new technical candidate; no selected release-candidate, all-source export and protected-byte audit. |
| G3–G5 | Zero eligible reviewed cues. Need at least 200 development cues, a separate sealed 300-cue holdout, independent source-aware scores, critical-error adjudication and approved terminology denominators. |
| G6–G9 | No selected package/SLA, full fault matrix, target-consumer export or unseeded clean Windows installation. |
| A1 | No approved Russian spoken script or human-reviewed speaker/voice lineage. |
| A2–A3 | Earlier real SAPI technical drafts exist, but the 14:42 ASUS full draft has 264 cue overruns and 259 overlaps; no accepted full-scene audio fit. |
| A4–A6 | No listener ratings across three approved 10–20-minute scenes, full durable natural-source audio pilot or accepted consumer-delivery/rights record. |

`task eval:data:commons:sethlui:media:preflight`,
`task eval:data:commons:sethlui:media:acquire`,
`task eval:data:commons:sethlui:media:derive`,
`task inspect -- .cache/eval/commons-sethlui-media/derived-1e655c9c-f93e-4b03-938c-f2510640fa2b/source.zh.srt`,
`task eval:data:commons:sethlui:candidate:stage`,
`task eval:data:commons:sethlui:candidate:check`, `task eval:data:check`,
`task eval:data:commons:sethlui:audio:preflight`,
`task eval:data:commons:sethlui:audio:sample`,
`task eval:data:commons:sethlui:audio:check`,
`task eval:regression:catalog:check`, `task docs:check`, `task plan:check`,
`task site:build` and `task site:check` completed for this slice. Both
FFprobe and the strict CLI checker first got sandbox child-process `EPERM`;
permitted reruns succeeded. The FFprobe failure is retained as a private
record. The public site still contains historical comparisons and a
source-free summary only. No newly claimed model run, TTS listening or
clean-install verification occurred.

Concrete next work: listen to beginning/middle/end source-audio windows and
check Chinese speech against pinned cues; resolve original/imported caption
and media rights; obtain independent bilingual reference and review without
seeding a model; compare selected translation configurations on the same
admitted source; then use an approved script for real Auralis audio fit,
listening and consumer playback. A separate unseeded Windows target and the
owner's eventual desktop-stage decision remain required. The unrelated
`docs/architecture/014-result-history-selection.md` edit and the local
Auralis voice worktree are outside this source slice and were not staged.
