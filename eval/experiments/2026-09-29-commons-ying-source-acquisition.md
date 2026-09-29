# Commons Ying Chinese source acquisition

Date: 29 September 2026. Scope: partial `DATA-03` discovery and strict input
inspection. This is not a translation, listening, rights, reference or release
acceptance record. The source is assigned no development/holdout split yet.

The exact [Simplified Chinese TimedText revision `1238607314`](https://commons.wikimedia.org/w/index.php?title=TimedText:WIKITONGUES-_Ying_speaking_Henan_Chinese.webm.zh-cn.srt&oldid=1238607314)
was retrieved through Commons `action=raw` and saved at
2026-09-29 04:24:08 UTC (local file creation time). The response
was HTTP 200, 6,021 bytes, SHA-256
`505913bd7046b28c873307562a55d567043f8703bc00375c3485853b87c420d9`.
Its exact bytes remain at
`.cache/eval/commons-ying-1238607314/source.zh.srt` outside Git; no
normalization or editing was performed. The revision API reports a single
creation edit at 2026-06-26 06:26:27 UTC by Commons user `स्वर्ण`. The edit
summary begins with the first SRT cue but does not state whether the text was
independently transcribed or imported from another caption service.

`task inspect -- .cache/eval/commons-ying-1238607314/source.zh.srt` passed:
strict SRT v1, 93 ordered cues, first cue 260–1,800 ms, last cue
215,120–217,320 ms. Cue 69 spans 16.18 seconds and cues 4, 20, 28, 42, 54,
59 and 71 last at most 460 ms. The inspector checked supported structure and
protected bytes; it did not verify caption accuracy, readability or speech
alignment. The page's source audio is Henan Mandarin, one speaker, and the
candidate does not meet the three natural-file duration tiers.

The [video page](https://commons.wikimedia.org/wiki/File:WIKITONGUES-_Ying_speaking_Henan_Chinese.webm)
labels the media CC BY-SA 4.0 and credits Wikitongues and Ying Li. The
[TimedText page](https://commons.wikimedia.org/wiki/TimedText:WIKITONGUES-_Ying_speaking_Henan_Chinese.webm.zh-cn.srt)
shows a general Commons unstructured-text CC BY-SA notice. These observations
do not settle the source transcription's origin, text attribution or any
Russian derivative's rights. The [Commons reuse guide](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia)
calls for item-level licensing and attribution checks. The candidate is
`inspected_candidate` in the [non-admitted inventory](../corpora/commons-inspected-candidates-v1.json);
subtitle, audio and reference rights are unapproved. No model
request, source-aware human review or public text redistribution was made.

The media description also links an [Amara video page](https://amara.org/v/cRgQ/).
On 29 September 2026 that URL returned an 88,121-byte login page, retained
only in ignored local storage with SHA-256
`5733a157f437a4fb0e290fb64f195ab84d0f78d783e6dbfb8214f83376586732`.
Its login destination identifies Amara video `QLx4WkMaXs0c`; the public
subtitle-language metadata request returned HTTP 403. Neither response identifies
the Chinese caption author or establishes that the Commons text was copied from
Amara. The Amara link is a provenance lead, not a license or attribution decision.

Next admission steps are a recorded source-text rights decision, source/audio
alignment and scene/speaker audit, reviewed Russian reference on the same cue
grid, and an admitted development inventory version. The 93 cues cannot by themselves
fill the approximately 200-cue development target or the independent holdout.
