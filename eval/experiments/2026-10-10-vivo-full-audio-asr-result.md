# Vivo full-audio ASR/caption diagnostic: every cue has temporal overlap

Date: 10 October 2026. Partial `DATA-03` evidence from the [frozen
plan](2026-10-10-vivo-full-audio-asr-plan.md). The selected source is the
[18:36 Geekerwan Vivo/MediaTek YouTube interview](https://www.youtube.com/watch?v=_G4e2p1p-is)
with a regular `zh-CN` track. The original-platform SRT has 467 strict cues,
SHA-256 `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
The version-matched private Commons WebM is SHA-256
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
These are the unchanged inputs from the [source selection](2026-10-09-youtube-chinese-scene-selection-result.md).

## One bounded offline pass

`task eval:data:youtube:vivo:asr:full:preflight`, `test`, `probe`, `report`
and `check` were run. Preflight checked the SRT, WebM and four model-file
hashes. The one probe used the committed runner at `16b1193`, the already
installed `faster-whisper` 1.2.1 / CTranslate2 4.8.2 / PyAV 17.1.0 and
`Systran/faster-whisper-base` revision
`ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66`. It ran CPU/int8,
Mandarin forced, beam 5, VAD off and previous-text conditioning off. No
subtitle text entered ASR; no download, second model, second ASR attempt,
translation or TTS call occurred. The process exited 0 within the 15-minute
cap; ASR elapsed time was 94.82 seconds. The private raw JSON is SHA-256
`a1f92de3e5d2a84baf070851e8248e6455ad432f1e63241749e543865f10d78e`;
the process record is
`237e23206241bf27eaf180a6aa2896b8f4535557a46f871ddf8ff3beef7ba7df`.
Both are retained under the ignored `vivo-full-audio-asr-v1` attempt.

The ASR produced 499 timed segments spanning 0–1,114.48 seconds of the
1,115.57-second media. Each of the 467 cue windows intersects at least one
ASR segment under the declared 0.5-second timing tolerance: 153/153 in the
first third, 165/165 in the middle and 149/149 in the last. This extends
the earlier three 12-second samples (36 seconds, about 3.2%) to a full-file
automated diagnostic. It is **temporal overlap**, not proof that every
caption word was spoken or attributed to the right person.

## Scoring defect found during AI inspection

The first source-free [machine report](../reports/2026-10-10-vivo-full-audio-asr-v1.json)
(SHA-256 `b55a04f02e340807c029d3d33c1294e2d1068a7be06ae67b55142b89b40517bf`)
flagged 30/461 scorable cues below the prespecified 0.40 raw
ordered-character-recall threshold. I inspected nine low-scoring cues across
the three thirds: 68, 145, 183, 314, 329, 389, 393, 415 and 464.
Several closely corresponding spoken phrases are in **traditional** Chinese
in the ASR output while the SRT uses **simplified** Chinese. Cue 145's
test phrase, for example, shares its meaning and placement while the ASR
also misspells the channel name; cue 464's thanks are scored zero because
`谢谢` and `謝謝` differ by code point. Cue 68 intersects a longer ASR
segment that starts before the cue. Cues 314 and 329 contain ASR wording
disagreements that cannot be adjudicated without listening; the chip numbers
near cue 415 are garbled by ASR. None of these nine establishes a caption
error. This was AI analysis of retained text, with **zero human listeners**.

The corrected [v2 machine report](../reports/2026-10-10-vivo-full-audio-asr-v2.json)
(SHA-256 `e378afc97915eeef133c3df79eb828742c25c35c3472b92bc4e9cd12783d10df`)
preserves all 30 raw flags and explicitly marks them as script-sensitive
review priorities, never confirmed caption defects. No ASR inference was
repeated; the original report and raw response remain intact. Three
deterministic controls now cover timing tolerance, exact/negative text and
traditional-versus-simplified false lows. A later scoring revision needs
a separately pinned Chinese-script conversion or a better independent
alignment method, with related negative controls before threshold claims.

## Admission and next work

The YouTube metadata advertises CC Attribution reuse, but the Commons
import still carries an unconfirmed license-review notice; the caption
author's permission and audio-component rights are unresolved. The regular
track is not labelled YouTube auto-generated, but its exact human editing
history is unknown. The source remains an `inspected_candidate` with **zero
eligible development or holdout cues**. A Chinese-speaking listener must
check exact words, timing and speaker changes; an independent bilingual
reviewer is also absent. The owner has said no volunteers are available and
has not authorized contacting any. G3–G5, A1–A6 and `RELEASE-05` remain
open; the v8 translation and all accepted results are unchanged.

Rollback of this diagnostic: ignore the full-ASR summary and continue with
the pinned original SRT/WebM and the earlier three-window record. The raw
attempt, first report and corrected interpretation remain preserved.
