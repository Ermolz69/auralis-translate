# Local ASR triage of the Vivo interview source audio

Date: 9 October 2026. Backlog: partial `DATA-03`. The bounded
[plan](2026-10-09-vivo-audio-asr-triage-plan.md) ran on the version-matched
[YouTube caption candidate](2026-10-09-youtube-manual-chinese-source-result.md).
This is AI-only source-audio triage. No person listened, no Russian adequacy
rating was assigned, and the source remains unadmitted.

## Frozen inputs and execution

The original-platform Chinese SRT remains SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`;
the 18:35.570 private video remains SHA-256
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
Previously decoded start, middle and end WAVs, each 12 seconds, were rehashed
before inference. The raw private ASR result is SHA-256
`43ed4372bfa06919cd4e84b8b725236917fdbc5613ef9521c28ae2e113e680eb`;
the bounded process record is
`360daf4b61ec109766b42b575107d4621e8b802f6c03bfc69c26f870330476fc`.
The single package installation succeeded; its report SHA-256 is
`a5057897264a7c57d1baeeae1d61cddb4f0eefc5290e5bc282d4a97bfb8caa74`.
The first offline report-check command failed with a local JavaScript
`TypeError` after the model run because a checker variable shadowed Node's
`process`. The checker was corrected and both report/check tasks then passed.
No package install, model download or ASR inference was repeated.

`faster-whisper` 1.2.1, CTranslate2 4.8.2 and the
[`Systran/faster-whisper-base`](https://huggingface.co/Systran/faster-whisper-base/commit/ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66)
model at revision `ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66` ran on
CPU/int8, beam size 5, without previous-text conditioning. The 145,217,532-byte
weight file SHA-256 is
`d01c3014881c9c6f3133c182f3d2887eb6ca1c789a7538c5c007196857a0a6a9`;
all model-file hashes and transitive package versions are in the
[redacted machine record](../reports/youtube-geekerwan-vivo-audio-asr-v1.json).
The single ASR process completed three windows in 11.126 seconds. No
subtitle text or Russian reference was supplied to Whisper. Mandarin was
**forced** in its call, so the returned `zh` label and probability are not
independent language detection.

## AI source/caption comparison

| Window | Overlapping SRT cues | AI comparison of raw ASR with SRT |
| --- | --- | --- |
| 0–12 s | 1–5 | Both describe visiting Vivo headquarters and an interview opportunity. The ASR misspells the city; cue 5 crosses the sample end. |
| 563–575 s | 233–238 | Both discuss cost/area tradeoffs and ask about disagreements between the companies. ASR garbles the company name and the words for disagreement/quarrel. |
| 1102–1114 s | 461–467 | Both contain thanks, future cooperation and better products. ASR garbles part of the thanks; the window starts inside an earlier cue. |

The three sampled locations are plausibly aligned at topic level. ASR errors
prevent treating this as exact word-level confirmation. These 36 seconds are
about 3.2% of the 18:36 item and do not check every cue, scene boundary or
speaker change. The separate Chinese SRT and audio rights are still
`unknown`; no human speech/alignment judgment or bilingual Russian reference
exists. The source remains an `inspected_candidate` with **zero eligible**
development or holdout cues. The current product v8, model selection, release
gates and Auralis audio handoff are unchanged.

`task eval:data:youtube:vivo:asr:preflight`, `install`, `probe`, `report`
and `check` were run. All final tasks passed within their declared limits;
the initial offline report-check failure above is retained. Next inspect
speaker/scene boundaries and any uncertain spans with an actual source-audio
listener when available. A separately scoped internal translation diagnostic
may use this source while explicitly remaining unreviewed; it cannot close
`DATA-03`, G3–G5 or the audio listening gates.
