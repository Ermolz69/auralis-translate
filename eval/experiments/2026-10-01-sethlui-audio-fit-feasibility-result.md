# Restaurant real-SAPI fit feasibility after full-media failure

Date: 1 October 2026. The previous [same-source real-audio result](2026-10-01-sethlui-real-audio-technical-result.md)
measured 256/263 cue overruns and 236 overlapping starts. Auralis local
`feat/real-tts-pilot` commit `d962142` froze a single read-only calculation
on the retained 263-WAV analysis and TTS reports, including their SHA-256
identities, 75-ms end margin, factor formula, four tempo thresholds and a
10-second budget. It made no model, SAPI, FFmpeg, playback or media request.

The one 17-ms calculation produced a private report SHA-256
`74f79ec23737ae8768e592a353f256aa314f28ce3016b6c6510f07abe437064d`.
At Auralis local commit `2ce8be5`, `task voice:natural:sethlui:fit:check`
independently recomputed all 263 duration/window factors, counts, median,
p95 and file thirds from the pinned source analysis. No source cue windows
overlap; the cue-end and next-start limits are equal.

| Required tempo no greater than | Cues of 263 |
| --- | ---: |
| 1.0× | 7 |
| 1.25× | 30 |
| 1.5× | 67 |
| 2.0× | 158 |

With a 75-ms end margin, the median required factor is **1.883×**, p95
**3.491×**, maximum **6.268×** at cue 143. Even hypothetical 2× speech leaves
**105/263** lines outside their original windows. The 1.5× counts across
beginning/middle/end thirds are 18/89, 22/89 and 27/85. This is arithmetic
feasibility, not a heard naturalness or intelligibility score. No stretching
was applied, and the private MKV and all 263 WAVs remain unchanged.

An approved Russian spoken script, reviewed shortening, voice/speaker policy
and listener assessments are needed before selecting any speed or declaring
`VOICE-03`/A1–A6 complete. The [redacted public JSON](../reports/2026-10-01-sethlui-real-audio-summary.json)
adds aggregate counts and the private report hash without subtitle or media
content. The earlier [ASUS result](2026-10-01-asus-audio-fit-feasibility-result.md)
used a different source and cannot rank scripts or models against this one.
