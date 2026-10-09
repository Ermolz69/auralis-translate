# Real Vivo WAV edge silence still leaves an audio fit gap

Date: 10 October 2026. Partial `VOICE-03` evidence from local Auralis
`feat/natural-tts-pilot` commits `18b96fa` and `7b2b06d`. That repository
retains `docs/voice/046-natural-vivo-edge-silence-plan.md`,
`docs/voice/047-natural-vivo-edge-silence-result.md`, and the ignored
per-cue report SHA-256
`091ca9e3f71f509ade8867faeec23f741c6d54a65f423254c47df22a5fb1efbc`.
The [source-free public record](../reports/2026-10-10-vivo-edge-silence-v1.json)
contains only aggregates and input identities; no WAV or subtitle text is
published.

One `task voice:natural:vivo:edge-silence:screen` attempt reread all 467
real SAPI WAVs in 806 ms. The frozen 221-sample frame peaks and three
thresholds counted only contiguous quiet starts and ends; internal pauses
were kept. No WAV was all-quiet. The separate
`task voice:natural:vivo:edge-silence:check` rehashed every WAV and
recomputed every cue and aggregate. Three deterministic controls passed
under `task voice:natural:vivo:edge-silence:test`. There were **zero** new
model, TTS, ASR, media, playback or subtitle requests.

The earlier ideal 1.5x whole-file deficit is **620,178 ms**. Potential
edge-only removal ranges from **320,802 ms** at an approximately -60 dBFS
peak threshold to **432,905 ms** at approximately -40 dBFS. Even the
widest threshold leaves **187,273 ms (3:07.273)** missing and requires an
ideal **1.668x** tempo before pauses, speaker changes and transitions.
At the more conservative -60 dBFS threshold the ideal tempo is **1.769x**.
The -40 dBFS detection may include quiet phonemes and is not an approved
trim. Neither threshold was applied to the WAVs or listened to.

Decision: **edge trimming alone does not repair A3** for the retained Irina
voice and unreviewed draft. A bounded same-text, real alternative-voice
comparison is the next audio engineering screen; script shortening remains
subject to source-aware meaning review. The full Goal, `VOICE-01`–`VOICE-07`,
A1–A6, rights and independent ratings remain open. All previous audio,
source, draft and failure records are preserved.
