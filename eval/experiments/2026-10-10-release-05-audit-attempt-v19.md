# RELEASE-05 self-audit v19: unchanged audio grouping rejected

Date: 10 October 2026. This extends the [v18 audit](2026-10-10-release-05-audit-attempt-v18.md)
with the [real-WAV grouping measurement](2026-10-10-vivo-group-fit-result.md).
The frozen PLAN-03 scope and all previous gate decisions remain in force.

The unchanged 467 SAPI WAVs total 2,291,610 ms. The first-to-last source
cue interval is 1,114,363 ms. A 75-ms final margin gives an optimistic
2.05657× whole-file requirement even without pauses or speaker transitions.
No grouping size of 16, 32, 64 or 467 cues covers any cues in a block that
fits at <=1.5×. The one read-only attempt, independent recheck and three
deterministic controls are retained; there were zero new model, TTS, ASR,
media or playback requests. The old source, draft, WAVs and rendered media
remain immutable.

**RELEASE-05 remains failed/open.** A3 cannot pass by regrouping the
unchanged WAVs. Removable silence and an alternative real TTS voice/rate
are unmeasured, while shortening requires reviewed source meaning. A1–A2
remain unapproved, A4–A6 lack listening and release evidence, G3–G5 lack
independent ratings, and G9/rights retain the previous gaps. No script,
sound, translation candidate or release artifact was promoted. Rollback is
the unchanged v8 translation profile on a fresh compatible run, with all
private audio and failed results retained.
