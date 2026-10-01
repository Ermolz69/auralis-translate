# Restaurant YouTube track confirms original subtitle overrun

Date: 1 October 2026. Partial `DATA-03`, `DATA-05` and `EVAL-04` provenance
evidence under the [metadata plan](2026-10-01-sethlui-rights-metadata-plan.md)
and [one-GET caption plan](2026-10-01-sethlui-youtube-caption-plan.md).
This does not admit the source into development, holdout, translation quality
or audio review.

The one bounded metadata-only yt-dlp invocation returned HTTP/extractor
success with video ID `yvCR-EqMhng`, uploader SETHLUI.com, upload date
1 March 2026, 738-second duration, a listed `zh-Hans` SRT track and the
literal video-license field `Creative Commons Attribution license (reuse
allowed)`. The raw metadata SHA-256 is
`ef0e47700896ec4ea2909ffcfdc12bc4075f6bc301006d86da9f8fda34ad0a8b`;
its private inventory SHA-256 is
`751794247ec5d0c37dc806d5e7e941359fc324bec85a7ee892d36f1289aedf18`.
The extractor executable SHA-256 is
`52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`.
No media or subtitles were downloaded in that metadata invocation.

The one subsequent HTTPS GET from the exact metadata-listed YouTube
`zh-Hans` SRT URL returned HTTP 200, `text/plain; charset=UTF-8`, 17,620
bytes in 284 ms, within its 30-second/256-KiB budget, without redirect or
retry. The private exact source SHA-256 is
`4e5e55ec5f50dad128391d1b907e9d0ba51e9fda1c40b13a828ae1d806d380d4`;
its acquisition report SHA-256 is
`6e595f2c49721a3a80e700a130abb7d10157986164759ee9b2d587c87cf82a08`.
Both are retained under ignored
`.cache/eval/youtube-sethlui-caption/caption-JTxK6K/`. The signed source
URL stays private; only its SHA-256 and allowed host/path are recorded.

`task inspect -- .cache/eval/youtube-sethlui-caption/caption-JTxK6K/source.zh.srt`
accepted **271 strict SRT cues**. `task eval:data:youtube:sethlui:caption:check`
verified that the first **17,618 bytes** are exactly the already-pinned
Commons TimedText revision
`077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967`;
the YouTube response adds only two final LF bytes. All 271 cue texts, IDs and
times therefore match. Cues 264–271 already exceed the measured 738,056-ms
video in the YouTube original: cue 263 ends at 732,900 ms, cue 264 starts at
840,100 ms, and cue 271 ends at 858,333 ms. The Commons importer did **not**
introduce this mismatch. The separate 263-cue derivative remains a mapped
technical candidate, not a replacement of either original. `REG-039` and its
timing controls remain the relevant regression; this check strengthens its
provenance rather than opening a duplicate error ID.

The [Commons file page](https://commons.wikimedia.org/wiki/File:Inside_One_Of_Singapore%E2%80%99s_Most_Refined_Cantonese_Kitchen_-_Behind_The_Plate_(Turn_on_CC).webm)
names the same YouTube source and CC BY 3.0, but its pre-August-2025 license
template conflicts with the stated March 2026 video date and it is flagged
as **license review needed**. The observed current YouTube metadata narrows
the video-license question but does not prove the exact license version or
original ownership of the Chinese caption track. [Commons guidance](https://commons.wikimedia.org/wiki/Commons:YouTube_files)
asks for license review for transferred YouTube videos; the [YouTube license
help](https://support.google.com/youtube/answer/2797468) describes the CC
Attribution option but does not authenticate this individual caption's
author. Video reuse, subtitle reuse and derived public audio therefore
remain separate unresolved rights decisions. No independent human has
listened to the source or confirmed Chinese speech/cue alignment. The source
inventory stays at ten technical candidates, 2,113 inspected cues and zero
eligible cues; the original SRT and video bytes were not published here.
