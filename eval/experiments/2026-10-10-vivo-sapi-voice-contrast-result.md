# Alternate real SAPI voices do not clear the Vivo timing screen

Date: 10 October 2026. Partial `VOICE-02`/`VOICE-03`, following the
[edge-silence rejection](2026-10-10-vivo-edge-silence-result.md). The
predeclared experiment `VOICE-VIVO-VOICE-CONTRAST-2026-10-10-v1` and
implementation are in Auralis local `feat/natural-tts-pilot` commits
`78b8bb0` and `1780e38`. The full Auralis result is local at
`docs/voice/049-natural-vivo-voice-contrast-result.md` in that branch;
its private WAV paths are deliberately not published.

The same 12 source-mapped, unreviewed Russian cues were synthesized three
times in a rotated order with `Microsoft Irina Desktop`, `Microsoft Pavel`
and `Microsoft Irina`: 108/108 real WAVs in 71,260 ms. The pinned Chinese
SRT, Russian draft and PowerShell runtime SHA-256 digests are in the
[source-free report](../reports/2026-10-10-vivo-sapi-voice-contrast-v1.json).
The private incremental run report is SHA-256
`b27f9c05e77c808fde5152f2dd2fc0e925ed8b497d93c271b32f187e10342e65`;
the checked analysis is SHA-256
`aa9a1ad8715be10d0e694f88432daef8a610e14299d1ef207ee977a96832b836`.
All 108 WAVs decoded at 22,050 Hz with zero clipped samples.

Irina Desktop and Irina each totaled 69,242 ms across 12 per-cue medians.
Pavel totaled 61,375 ms, shorter on 12/12 cues. His paired median duration
ratio was **0.886**, above the frozen **0.85** advancement ceiling. Only
1/12 Pavel cues fit even at 1.5x their original slots. Neither alternative
advances to a new 467-cue run. This is a technical duration comparison,
not a naturalness or translation rating.

`task voice:natural:vivo:voice-contrast:probe`,
`task voice:natural:vivo:voice-contrast:inspect`,
`task voice:natural:vivo:voice-contrast:check` and Auralis
`task docs:check` passed. The first docs check hit sandbox `spawn EPERM`
before the test child started; the permitted rerun passed. No source, prior
WAV, full media or accepted result was changed. The original Irina Desktop
full-file baseline is the rollback path via a fresh run. The source's
speech alignment, subtitle/audio rights, Russian meaning, spoken script and
human listening remain unapproved. A3 and RELEASE-05 stay open.
