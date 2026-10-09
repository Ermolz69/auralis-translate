# RELEASE-05 self-audit v17: source relation warnings

Date: 10 October 2026. This extends the [v16 audit](2026-10-10-release-05-audit-attempt-v16.md)
with the [offline relation review](2026-10-10-source-relation-review-v1-result.md).
The frozen PLAN-03 scope and every v16 gate decision remain in force.

The new warning rule found the three exposed full-draft relation errors at
cues 276, 280 and 466 and warned on five of six saved paired replies. It
processed no new translation, ASR or TTS request. Only three of 467 source
cues matched the rule, and its unflagged answer for cue 466 still needs
meaning/agency review. This is not independent bilingual adjudication or a
corrected spoken script. The previous clock warning at cue 328 is separate.

**RELEASE-05 remains failed/open.** G3–G5 and A1 remain open because the
translation still contains known meaning errors and zero independent ratings.
A3 still fails measured fit; G9, A4–A6, rights and source-audio listening
remain open as in v16. No product profile, source, checkpoint, WAV or media
artifact changed. Rollback continues to be a fresh v8 run against a
compatible backup database, retaining prior data and failed attempts.
