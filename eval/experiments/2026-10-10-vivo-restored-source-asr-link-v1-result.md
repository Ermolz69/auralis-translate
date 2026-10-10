# Restored Vivo YouTube SRT linked to retained full-audio ASR

Date: 10 October 2026. Partial `DATA-03` evidence under the committed
[frozen plan](2026-10-10-vivo-restored-source-asr-link-v1-plan.md)
at `4ffa71789bc7f1f957e0c573882edc096292b267`. This was one offline
computation: **zero** new model, ASR, network, audio-decode or TTS calls.

The [exact-byte restored original YouTube SRT](2026-10-10-youtube-vivo-caption-restoration-v2-result.md)
is SHA-256 `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
The matched WebM is SHA-256
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
The retained 499-segment full-audio ASR raw response is SHA-256
`a1f92de3e5d2a84baf070851e8248e6455ad432f1e63241749e543865f10d78e`.
The model ran previously on audio without subtitle text; it used pinned
`faster-whisper-base`, CPU/int8, forced Mandarin, beam 5, no VAD and no
previous-text conditioning. The archived OpenCC `t2s` conversion was
rehashed separately. The raw whole-file scores recomputed exactly to the
existing v2 public report, and the converted aggregate scores match the
existing OpenCC report.

| Frozen source window | Intersecting cue IDs | Cues with timed ASR overlap | Below 0.40 after script normalization |
| --- | --- | ---: | --- |
| 00:00–00:12 | 1–5 | 5/5 | none |
| 09:23–09:35 | 233–238 | 6/6 | none |
| 18:22–18:34 | 461–467 | 7/7 | cue 464 |

Across the full scene, all **467/467** cues have temporal ASR overlap. The
raw character-recall screen had 30 low-scoring cues; the retained script
conversion reduces that to five. The [machine report](../reports/2026-10-10-vivo-restored-source-asr-link-v1.json)
is SHA-256 `f9c29515bf28937e6d601fe99a8d7a0e3417f72cf389a1457a3f089e4ba8981d`.
Two deterministic controls checked exact window boundaries and absence of
speech evidence when no segment is present. `task
eval:data:youtube:vivo:restored-asr:preflight`, `report` and `check`
passed with `SOURCE_ROOT=E:\Anything\Projects\Commercial\auralis-translate`.

The separate [AI source-aware text review](../reports/2026-10-10-vivo-restored-source-asr-link-v1-ai-review.json)
(SHA-256 `715fd784b3cf62a2f220395d666b9f6b94a6020c963a88019693f20dddc96a05`)
found plausible scene/topic order in all three windows. The ASR makes
several place, company and word errors. At cue 464 it has only one short
thanks phrase where the SRT also contains a repeated thanks and an English
interjection. Listening is needed to distinguish an ASR omission from a
caption mismatch. This AI reading is **not** a Chinese-speaking human
adjudication.

The restored SRT is now linked to reusable raw full-media evidence, but
temporal overlap and recall do not verify exact spoken words, speaker
assignment or caption authoring. The earlier three-window ASR raw file is
still absent; this screen uses the distinct retained full-audio run. Rights
to the captions and audio are unresolved, human Chinese listeners remain
zero, and **zero cues are admitted**. Product v8 and accepted translations
are unchanged. Rollback is to ignore this derived linkage while preserving
the exact restored SRT, original WebM, immutable full-ASR raw response and
all prior machine reports.
