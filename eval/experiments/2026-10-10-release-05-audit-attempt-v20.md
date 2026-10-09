# RELEASE-05 self-audit v20: retained voice edge trim rejected

Date: 10 October 2026. This extends the [v19 audit](2026-10-10-release-05-audit-attempt-v19.md)
after the [real-WAV edge-silence screen](2026-10-10-vivo-edge-silence-result.md).
The frozen PLAN-03 scope and every earlier gate decision remain binding.

All 467 retained SAPI WAVs were rehashed without editing. The single
read-only screen and independent checker found at most 432,905 ms of
potential quiet edge frames at the broadest frozen threshold. The
unchanged-voice whole-file deficit at 1.5x is 620,178 ms; even this
unapproved trim leaves 187,273 ms and an ideal 1.668x requirement before
speaker pauses or transitions. There were zero new model, TTS, ASR,
media or playback requests. No actual trimmed media, listening or
source-aware script approval followed.

**RELEASE-05 remains failed/open.** A3 is still failed for the current
draft and voice. G3–G5 and A1 lack independent review; A4–A6 lack the
required listener, full-scene and delivery evidence. G9, source rights
and other v19 gaps remain. Do not promote the retained technical media.
The unchanged v8 profile remains the translation fallback through a fresh
compatible run; all failed and private artifacts remain preserved.
