# Complete ASUS real-speech technical diagnostic

Date: 30 September 2026. This is a redacted cross-repository record of the
local Auralis `VOICE-ASUS-FULL-TECH-2026-09-30-v1` dossier.
Auralis branch `feat/real-tts-pilot` commits `20d8a20`, `2514482`, `3ecccb3`,
`ae49740`, `7d5bb8b` and `12b109d` are local on this machine; the Translate
submodule pin and original project files were not changed. Auralis private
report/media bytes remain ignored and are not published here. The exact
redacted [summary JSON](../reports/2026-09-30-asus-full-audio-summary.json)
contains the measured hashes and failures.

The frozen source is a 268-cue, 14:42 Chinese SRT, SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`;
the matching Commons 240p VP9/Opus WebM SHA-256 is
`9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1`.
The complete v6 Russian SRT candidate SHA-256 is
`aa74b20d4255f46c9a23ddfd0865dd2e221e7b08ab3cbceb8665be3b0c7b6e8b`.
It is structurally valid but remains `needs_review` after source-aware **AI**
triage found factual and terminology errors in 44 selected cues. Independent
Chinese/Russian review is 0/268. No reference or reviewed correction entered
the speech probe.

Using the installed `Microsoft Irina Desktop` `ru-RU` voice and pinned
PowerShell runtime SHA-256
`362a356ce7f0940ec74f73a8fc2c990a2cc24a38a11c90bbd8eca947110ad139`,
Auralis made **one** real SAPI attempt. It produced and rehashed 268/268
decodable private WAVs in 163,610 ms. The retained TTS report and PCM analysis
SHA-256 values are
`9c1aa881c71613488538cff84720e248199b5e065a4022cfdf2d4af627a1ea2b`
and `9c1975d171bdf9f5057343d96e7078bba0b9e4e226f6f1d188918413ffe9af0b`.
Individual WAVs have zero clipped samples, but 264/268 overrun their exact
subtitle windows and 259 start while earlier synthesized speech continues.
The worst overrun is 8,826 ms. No continuous RAM peak was sampled.

Three separate, predeclared one-attempt mux variants used those **same** WAVs:

| Variant | Measured outcome | Retained failure/result report SHA-256 |
| --- | --- | --- |
| v1 | 882,223-ms container, only 868,076 ms decoded audio; 14,147-ms missing tail | `2c5d972ac87d8602ad2b4fb2dd90caa9d0841925b658e3ec1e688f8f555125f5` plus independent failure analysis `db639eeef3ba8907b29a4cafe44f39e4fbf301c369deb8fd87134f92c03c6b6a` |
| v2 | 882,223-ms audio present, but 896,370-ms container; 2,867-ms maximum packet gap | `6ea281f65836718c31c3e31c7a10a63a1f8726a6092df946e5181f0b03020130` plus independent duration analysis `384129e4e20e88d4a1fc46756542f79dcfd64560a061110da8d1c5bba8160442` |
| v3 | VP9/Opus 882,231-ms container, 882,223-ms decoded audio, 1-ms maximum packet gap and zero clipped output samples | `f7711b9f04f1ec2625327ae16a3a6dcad798589ac2a8094a698929a5f48a96cd` |

V1's initial success label was disproved by the new exact tail-coverage check.
V2's full decoded sample count was insufficient: the container timeline was
14,147 ms too long. Regressions now require both full decoded audio and a
continuous near-source-length container. The v3 private 29,980,312-byte
Matroska SHA-256 is
`75253e8e7c92b950434f82c82fd4d4e245d0c6ef525983bcd311c8dceeecd888`.
The complete `ffplay -autoexit -nodisp` process exited successfully in
882,477 ms; playback-record SHA-256 is
`a85ce5b22c7c7e0e7aef48a271c008aa6b3cea53a7211cf493efcc17b1208bbd`.
Video was fully decoded and its stream identity was verified separately;
the player run was audio-only display and **not** visual inspection.

No person listened or scored any Russian audio. Auralis did not accept a
spoken script or publish a managed natural speech batch. The
[Commons file page](https://commons.wikimedia.org/wiki/File:ASUS_ROG-Handheld-Leistungsanalyse_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_01.webm)
claims CC BY 3.0 for the video but retains a license-review-needed notice;
caption authorship/rights and source speech alignment are not admitted.
Three distinct reviewed 10–20-minute scenes, fit adaptation, pronunciation,
listener scores, production worker, full restart/cancellation matrix and
clean Windows installation remain open. This is `VOICE-02`/`VOICE-03` technical
evidence only, not A1–A6 or G1–G9 acceptance.

Checked in Auralis: `task voice:natural:asus:inputs:check`,
`task voice:natural:asus:tts:probe`,
`task voice:natural:asus:tts:inspect`,
`task voice:natural:asus:media:coverage:inspect`,
`task voice:natural:asus:media:v2:inspect`,
`task voice:natural:asus:media:packet:inspect`,
`task voice:natural:asus:media:v3:probe`,
`task voice:natural:asus:media:v3:play`,
`task voice:natural:asus:media:v3:check`, `task media:probe`,
`task docs:check`, `task rs:fmt` and `task voice:tts:lint`.
The first sandboxed inventory run stopped with `EPERM` before any TTS;
the corrected input preflight then caught a mistyped 63-character hash before
synthesis. Both failures were retained and did not consume a second TTS
attempt. V1/v2 mux failures remain retained with regressions. No media or
source text has been placed on public Pages.
