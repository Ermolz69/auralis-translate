# RELEASE-05 self-audit v21: selected YouTube source and alternate voices

Date: 10 October 2026. This extends the [v20 audit](2026-10-10-release-05-audit-attempt-v20.md)
without changing PLAN-03's required scope or thresholds. The committed
Translate candidate still uses the same product v8, with the original
Chinese and Russian draft hashes pinned in the
[Vivo source](2026-10-10-youtube-vivo-source-recheck.md) and
[voice contrast](2026-10-10-vivo-sapi-voice-contrast-result.md) records.

`task eval:data:youtube:vivo:caption:check` rechecked all 467 source
cue texts and the eight <=1 ms timing differences against the retained
18:35.570 media copy. `task eval:data:youtube:vivo:asr:check` rechecked
the beginning, middle and end 12-second samples. This is still AI-only
topic and clause-order overlap. No person verified speech, speakers or
word timing. YouTube advertises a regular `zh-CN` SRT and no automatic
caption track, but human transcription, subtitle/audio grants and Commons
license review are not established. The 18:36 scene remains a private
development candidate with zero release-admitted cues.

The new one-attempt Auralis real-SAPI screen synthesized 108/108 WAVs
on 12 identical Russian cues. Independent rehash, decode and duration
checks passed. Pavel was shorter on 12/12 but its paired median duration
ratio 0.886 exceeded the frozen 0.85 advancement limit. Neither other
voice proceeds to another full-file TTS run. There were zero human
listeners or approved spoken scripts, so this screen does not change A3
or any other audio gate.

**RELEASE-05 remains failed/open.** G3–G5 need independent bilingual
ratings and approved terminology; G9 needs an unseeded target. A1 lacks
reviewed lineage and rights; A3 fails the retained full-file fit; A4–A6
need approved, listened scenes and playback of accepted media. Preserve
all original files, drafts, prior WAVs, failed results and v8 rollback.
The next independent source step is a rights decision and actual
Chinese-speech/speaker review, while source-derived meaning warnings
can be exercised against a second development source without exposing
the sealed holdout.
