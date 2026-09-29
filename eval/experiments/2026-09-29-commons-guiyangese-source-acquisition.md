# Commons Guiyangese Chinese source acquisition

Date: 29 September 2026. Scope: partial `DATA-03` discovery and strict input
inspection. This is not a translation, listening, rights, reference or release
acceptance record. The complete media item has no assigned development/holdout
split yet.

The exact [Simplified Chinese TimedText revision `516184835`](https://commons.wikimedia.org/w/index.php?title=TimedText:WIKITONGUES-_Changjiu_and_Chaofen_speaking_Guiyangese.webm.zh-hans.srt&oldid=516184835)
was retrieved through Commons `action=raw` and saved at 2026-09-29 04:33:19
UTC (local file creation time). The response was HTTP 200, 5,524 bytes,
SHA-256 `084389c003799447f5e8c3e02ee92aa6d0d76df55b7ccf01c1bcf186dd7212c4`.
The exact bytes remain at
`.cache/eval/commons-guiyangese-516184835/source.zh.srt` outside Git.
The revision API reports a single creation edit at 2020-12-01 18:34:09 UTC
by Commons user `Lovewhatyoudo`. The edit summary starts with the first SRT
cue and does not establish whether captions were independently transcribed
or imported.

`task inspect -- .cache/eval/commons-guiyangese-516184835/source.zh.srt`
passed strict SRT v1: 66 ordered cues, first 63–5,917 ms, last
281,028–287,529 ms. The full inspector output remains in the ignored
`inspect.txt` beside the source. Some cues include `常久:` or `朝芬:` speaker
labels as ordinary text. The inspector accepted this syntax but did not
separate speaker identity, verify caption accuracy, or listen to the two
speakers. Any scene and speaker map must be reviewed before use; the label
must not be silently removed from protected source text.

The [video page](https://commons.wikimedia.org/wiki/File:WIKITONGUES-_Changjiu_and_Chaofen_speaking_Guiyangese.webm)
labels the media CC BY-SA 4.0 and credits Wikitongues and Brian Zhao. The
[TimedText page](https://commons.wikimedia.org/wiki/TimedText:WIKITONGUES-_Changjiu_and_Chaofen_speaking_Guiyangese.webm.zh-hans.srt)
has a general Commons unstructured-text CC BY-SA notice. Those facts do not
establish the source transcription's origin, text attribution, separate
Russian reference rights or permission to publish a derived audio track.
The candidate remains `discovered`, with subtitle/audio/reference rights
unapproved. No model request or public source-text redistribution occurred.

The earlier [Ying candidate](2026-09-29-commons-ying-source-acquisition.md)
has 93 inspected cues. The two sources therefore provide 159 structurally
accepted *candidates*, not 159 licensed or reviewed development examples.
They are both short dialect media and do not cover standard Mandarin or the
required 30/90/180-minute natural-file tiers.
