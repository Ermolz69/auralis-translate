# Unchanged Vivo WAVs do not fit by cue grouping alone

Date: 10 October 2026. Partial `VOICE-03` evidence from the local Auralis
`feat/natural-tts-pilot` branch. Auralis commits `4c44555` and `3d20480`
freeze `docs/voice/044-natural-vivo-group-fit-plan.md` and
`docs/voice/045-natural-vivo-group-fit-result.md` in that repository. The
[source-free public record](../reports/2026-10-10-vivo-group-fit-v1.json)
retains the private report SHA-256
`8d1eb7bd681f8b10c2eb484bc13c96e45badbe3aef85a7c2c5b0051ec44edd42`.
The private input reports have SHA-256
`eeb049e1bd3ad4639e0ba4f3aaead95cd7a464c1cda3c534f03f5d6bd7ade7c1`
and `5e8680d88bbadbccbd247284db9bacc0583db249137b81ca5b6ae1805dba6de8`.

The one read-only `task voice:natural:vivo:group-fit:screen` attempt took 8 ms.
It made zero TTS, model, ASR, media or playback requests. Three deterministic
controls passed under `task voice:natural:vivo:group-fit:test`. The separate
`task voice:natural:vivo:group-fit:check` rehashed both inputs and recomputed
every arm's counts, tempo thresholds and worst block.

The unchanged 467 WAVs total **2,291,610 ms (38:11.610)**, against a
first-to-last source-cue interval of **1,114,363 ms (18:34.363)**. Even
concatenating them without pauses requires **2.05657x** playback tempo.
At 1.5x, the generated audio would need to lose at least **620,178 ms
(27.1%)** before allowing any speaker turn, pause or transition. Zero of
the 467 cues lie in a mathematically fitting block when partitioned into
16-cue, 32-cue, 64-cue or whole-file groups; the 1/2/4/8-cue counts are
50/28/8/8 respectively. These are arithmetic bounds for retained WAVs,
not a listener-approved tempo or an assessment of a different voice.

Decision: do not promote grouping alone as an A3 remedy. Next measure
removable silence in the retained WAVs and screen a bounded alternative
voice/rate only after that measurement. Source-aware script adaptation
requires approval; no unreviewed words may be dropped to make timing fit.
The original SRT, Russian draft, WAVs, failed technical media and earlier
reports are unchanged. G3–G5, A1–A6 and `RELEASE-05` remain open.
