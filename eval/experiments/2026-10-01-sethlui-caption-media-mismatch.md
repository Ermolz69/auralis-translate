# Restaurant caption: strict SRT outlasts its video

Date: 1 October 2026. Backlog: partial `DATA-03`/`DATA-05` and `EVAL-04`.
The [revision inventory](2026-10-01-sethlui-caption-revision-plan.md) was
committed at `8217780` and the [pinned acquisition plan](2026-10-01-sethlui-caption-acquisition-plan.md)
at `5541a2b` before their respective network requests. Each made one Commons
GET, HTTP 200, no retry. The revision API response had 480 bytes, SHA-256
`f612add78c7924c02a93ef3dd8f9e4f8e6e7cda6e759e69d35db932937de9108`,
and identified revision `1200692574`, imported by `TaronjaSatsuma` on
20 April 2026. Import edit attribution does not establish original caption
authorship or rights.

The exact Chinese TimedText response was 17,618 bytes, SHA-256
`077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967`,
acquired in 354 ms. Its acquisition record SHA-256 is
`41ee99dfd604b4333203dd022cf36f83f493914ca25cb6ef7ff78dc4d73c4c07`.
The original response, unchanged SRT copy, edit metadata and reports remain in
ignored `.cache/eval/commons-sethlui-caption/`; no source text or media bytes
are published in Git.

`task inspect -- .cache/eval/commons-sethlui-caption/caption-Cgsmq4/source.zh.srt`
accepted **271 strict SRT cues**. Syntax acceptance was insufficient for a
matched video: the [Commons file page](https://commons.wikimedia.org/wiki/File:Inside_One_Of_Singapore%E2%80%99s_Most_Refined_Cantonese_Kitchen_-_Behind_The_Plate_(Turn_on_CC).webm)
lists **12:18** media duration. Using a conservative **12:19** upper bound,
`task eval:data:commons:sethlui:caption:check` finds 8 cues beyond the video.
Cue 263 ends at 12:12.900; cue 264 starts at 14:00.100 and ends at
14:03.666; cue 271 ends at 14:18.333. This >1:40 timing gap is not a rounding
error. The 263 earlier cues are not yet certified against speech or rights;
they may only become a new mapped derivative after separate provenance,
alignment and immutable-source checks.

The original 271-cue SRT is **rejected as a complete matched-media scene**.
It is not added to the nine registered candidates, to development or to the
holdout. The eligible count remains zero. The Commons copy declares CC BY 3.0
but flags the imported license as unreviewed; the subtitle's own license,
speech language throughout, speakers, and Chinese-to-Russian reference remain
unknown. No model request, translation quality score, TTS, playback or human
listening is claimed.

`REG-039` pins this exact source timing defect. The minimal reproducer is the
pair of cue-263/264 time windows against 12:19; related controls include an
overlong early or middle cue, and negative controls include an exact-end cue
and a cue within a verified media duration. The reusable coverage check now
examines **every** parsed cue when a candidate inventory supplies documented
`media_duration_ms`. `task eval:data:check` verifies the inventory contract,
the exact boundary, 1 ms overrun, out-of-order middle overrun, and invalid
duration/timing. `task eval:data:commons:sethlui:caption:check` pins the
private bytes and observed 8-cue failure. A future actual media-stream
inspection is needed before deriving a usable 12-minute scene.
