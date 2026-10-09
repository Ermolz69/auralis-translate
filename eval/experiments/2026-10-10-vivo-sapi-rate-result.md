# Vivo real-SAPI speaking-rate screen: audition candidate only

Date: 10 October 2026. Auralis local `feat/natural-tts-pilot` commits
`2d432e6`, `93cd2cf` and `f4f820e` add a bounded SAPI rate and retain the
frozen plan, 36 real WAVs, independent checks and result. The exact private
record is `docs/voice/051-natural-vivo-sapi-rate-result.md` in that Auralis
checkout. The [source-free summary](../reports/2026-10-10-vivo-sapi-rate-v1.json)
binds its private TTS report SHA-256
`f7edbeafc02f3e4791370f8246b0b131f9a2beb48e199cce7d098e39a71901b0`
and decoded analysis SHA-256
`3a13253f7320b4c7974dcb080e9c42832c5255bc7de1e7fbd1c022f4cbe48596`.
Neither Chinese/Russian text nor generated WAV/media bytes are published.

The same 12 exposed beginning/middle/end Russian cues from the 467-cue
7B/v8 `needs_review` draft were synthesized once each with Microsoft Irina
Desktop at SAPI rate 0, 5 and 10. All 36 real 22,050-Hz WAVs decoded,
contained nonzero signal and had zero clipped samples. Synthesis took
28,347 ms, with one actual TTS run and no TTS retries. The sandboxed voice
preflight first failed on `spawn EPERM` before synthesis; the identical
process-permitted preflight passed. No translation, ASR or media request ran.

| Rate | Sum of 12 WAVs | Relative to fresh rate 0 | Fits at <=1.5x plus 75 ms margin |
| ---: | ---: | ---: | ---: |
| 0 | 69,242 ms | 1.000 | 0/12 |
| 5 | 40,077 ms | 0.579 | 8/12 |
| 10 | 23,158 ms | 0.334 | 9/12 |

Rate 0 reproduces the earlier baseline duration exactly. Rate 10 meets
the predeclared technical screen for a **separate private audition**:
summed ratio <=0.73, at least 8/12 fits and no clipping. It still misses
three sampled cue windows at 1.5x. The sample cannot establish full-file
fit; higher speaking rate may damage intelligibility and naturalness.
No person listened, no Chinese–Russian person approved the draft or spoken
script, and source/media rights remain unresolved. No A1–A6 gate passes.

Auralis checks: `task voice:natural:vivo:rate:preflight`, `probe`, `inspect`,
`check`, `task rs:fmt`, `task rs:clippy`, `task docs:check`. The independent
checker reread all private WAVs and recomputed duration, fit, clipping and
nonzero signal. Next freeze a private 10–20-minute scene audition or shorter
representative listening packet without promoting rate 10 or regenerating
the 467-cue file. The product adapter defaults to rate 0, so rollback is a
fresh default-rate run while preserving the existing WAV and video artifacts.
