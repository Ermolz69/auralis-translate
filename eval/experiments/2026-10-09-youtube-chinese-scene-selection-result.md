# Chinese YouTube scene selection and three-point speech screen

Date: 9 October 2026. Backlog: partial `DATA-03`. This consolidates the
previously frozen [source-version](2026-10-09-youtube-manual-chinese-source-result.md)
and [local ASR](2026-10-09-vivo-audio-asr-triage-result.md) runs after rechecking
their retained files. No new media, caption or model request was made here.

## Selected 10–20-minute scene

Use the complete [Geekerwan Vivo/MediaTek interview on YouTube](https://www.youtube.com/watch?v=_G4e2p1p-is),
video ID `_G4e2p1p-is`, uploaded 4 January 2025 by channel
`UCeUJO1H3TEXu2syfAAPjYKQ`. Its measured private WebM duration is
18:35.570 (YouTube metadata rounds to 18:36). This is one continuous
18:36 source scene for development diagnostics. The original-platform
`zh-CN` SRT has 467 strict cues, from 00:00:00.100 to 00:18:34.463.
The original video and subtitle files remain immutable and private.

| Retained input | SHA-256 | Observation |
| --- | --- | --- |
| YouTube metadata response | `66624027735c409eb650ab218560836e630653855e90c858bf832ab3886ba329` | One regular Chinese SRT track; no YouTube automatic track advertised |
| Original-platform Chinese SRT, 33,577 bytes | `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4` | 467 strict SRT cues |
| [Commons caption revision 979826861](https://commons.wikimedia.org/w/index.php?title=TimedText:%E9%87%87%E8%AE%BFvivo_%26_MediaTek%E7%A0%94%E5%8F%91%E5%A4%A7%E4%BD%AC%EF%BC%9A%E8%93%9D%E5%8E%82%E4%B8%8E%E5%A4%A9%E7%8E%91%E5%90%88%E4%BD%9C%E8%83%8C%E5%90%8E%E7%9A%84%E6%95%85%E4%BA%8B.webm.zh.srt&oldid=979826861), 33,575 bytes | `8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000` | All 467 cue texts and IDs match; eight timing rows differ by at most 1 ms |
| Private 240p WebM from the [Commons file](https://commons.wikimedia.org/wiki/File:%E9%87%87%E8%AE%BFvivo_%26_MediaTek%E7%A0%94%E5%8F%91%E5%A4%A7%E4%BD%AC%EF%BC%9A%E8%93%9D%E5%8E%82%E4%B8%8E%E5%A4%A9%E7%8E%91%E5%90%88%E4%BD%9C%E8%83%8C%E5%90%8E%E7%9A%84%E6%95%85%E4%BA%8B.webm) | `7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507` | FFprobe 1,115,570 ms; no cue ends beyond the media |

The track is *regular*, not marked as YouTube automatically generated. This
does not establish whether a person transcribed every word: YouTube also
supports uploaded text with automatic timing. The [machine comparison](../reports/youtube-geekerwan-vivo-caption-v1.json)
supports a specific subtitle/video version by duration and cue identity;
neither property alone proves speech alignment.

## Speech versus captions: start, middle, end

The pinned offline `faster-whisper-base` CPU/int8 pass transcribed three
independent 12-second audio windows with no subtitle text in the ASR request.
The model revision, weights, package versions, audio hashes, time and private
raw-transcript hash are in the [machine record](../reports/youtube-geekerwan-vivo-audio-asr-v1.json).
The comparison below is an AI reading of those raw transcripts against the
matching SRT cues, not an actual listening or human Chinese-language review.

| Source time and cues | Independent ASR/caption agreement | Limit |
| --- | --- | --- |
| 00:00–00:12, cues 1–5 | Both identify a visit to Vivo's Dongguan headquarters, its phone development, and the chance to interview two industry leaders. The second cue is nearly verbatim after script normalization. | ASR misspells Dongguan; cue 5 continues beyond the clip. |
| 09:23–09:35, cues 233–238 | Both cover cost and area tradeoffs, then ask whether Vivo and MediaTek disagreed. The opening cost/area clauses and question order match. | ASR garbles MediaTek, the disagreement word and the last clause. |
| 18:22–18:34, cues 461–467 | Both contain thanks, expected further cooperation and better products. The last two substantive clauses occur in the same order. | The clip starts inside cue 461; ASR garbles a thanks phrase. |

The evidence supports **plausible alignment of three sampled locations**, not
word-for-word alignment of all 467 cues, exact speaker mapping or human
listening. The sampled 36 seconds cover about 3.2% of the media. The audio
files were rehashed on 9 October 2026, and `task
eval:data:youtube:vivo:caption:check` and `task
eval:data:youtube:vivo:asr:check` passed. Both tasks validate the frozen
reports and private inputs. The [ASR analysis](2026-10-09-vivo-audio-asr-triage-result.md)
records its transcription errors and forced Mandarin setting.

## Rights and admission decision

The original-platform metadata reports `Creative Commons Attribution license
(reuse allowed)`. The [Commons file page](https://commons.wikimedia.org/wiki/File:%E9%87%87%E8%AE%BFvivo_%26_MediaTek%E7%A0%94%E5%8F%91%E5%A4%A7%E4%BD%AC%EF%BC%9A%E8%93%9D%E5%8E%82%E4%B8%8E%E5%A4%A9%E7%8E%91%E5%90%88%E4%BD%9C%E8%83%8C%E5%90%8E%E7%9A%84%E6%95%85%E4%BA%8B.webm)
names Geekerwan and CC BY 3.0 for the video, but explicitly says a Commons
license reviewer has not confirmed it. The regular Chinese track's author and
separate permission for that text have not been established. The video label
alone does not resolve those caption rights or every audio component.

Decision: retain this version-pinned pair for **private, unreviewed development
diagnostics**. It has zero admitted `development_only` or holdout cues and is
not a rights-cleared publication or release audio source. The next source
gate is a Chinese-speaking listener checking words, timing and speaker
changes at the sampled windows and scene boundaries, together with a separate
caption-rights decision. In the meantime, translation and audio engineering
can be exercised against this source with `needs_review` labels; G3–G5,
LONG-04 and A1–A6 cannot be accepted from these samples.

The [ASUS original-platform video](https://www.youtube.com/watch?v=y3-4FgTmGIQ)
also advertises a regular Chinese track, but its current 22:55 version is
492,777 ms longer than the retained 14:42 media copy. It is rejected as a
source/subtitle pairing pending a version map.
