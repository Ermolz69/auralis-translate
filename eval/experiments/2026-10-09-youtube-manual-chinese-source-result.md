# YouTube regular Chinese captions: source-version screen

Date: 9 October 2026. Backlog: `DATA-03`. This was a source search and
version comparison, not a translation evaluation or audio admission. No model
or TTS call was made. The video and caption originals remain private.

## Selected candidate: Geekerwan Vivo/MediaTek interview

The [creator's YouTube video](https://www.youtube.com/watch?v=_G4e2p1p-is)
is an 18:36 interview. The one bounded metadata request, pinned in the
[source plan](2026-10-09-youtube-geekerwan-vivo-source-plan.md), reported
creator channel `UCeUJO1H3TEXu2syfAAPjYKQ`, upload date 2025-01-04,
`Creative Commons Attribution license (reuse allowed)`, one regular `zh-CN`
caption track with SRT and no YouTube automatic caption tracks. This
distinguishes the regular supplied track from YouTube's automatic captions;
it cannot prove a person transcribed or edited its words. Raw metadata
SHA-256: `66624027735c409eb650ab218560836e630653855e90c858bf832ab3886ba329`.

The original-platform SRT request returned HTTP 200 with 33,577 bytes,
SHA-256 `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
`task inspect` accepted 467 strict SRT cues. The already retained
[Commons caption revision 979826861](https://commons.wikimedia.org/wiki/TimedText:%E9%87%87%E8%AE%BFvivo_%26_MediaTek%E7%A0%94%E5%8F%91%E5%A4%A7%E4%BD%AC%EF%BC%9A%E8%93%9D%E5%8E%82%E4%B8%8E%E5%A4%A9%E7%8E%91%E5%90%88%E4%BD%9C%E8%83%8C%E5%90%8E%E7%9A%84%E6%95%85%E4%BA%8B.webm.zh.srt)
is 33,575 bytes, SHA-256
`8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000`.
All 467 cue texts and IDs match exactly. Eight timing rows differ by at
most one millisecond; the original response has a different terminal LF.
The source-copy equivalence is therefore supported at text/cue level, not
byte identity. The machine-readable [version comparison](../reports/youtube-geekerwan-vivo-caption-v1.json)
retains every timing delta without republishing source text.

The matching private 240p WebM has SHA-256
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
Pinned FFprobe measured 1,115,570 ms; current YouTube metadata rounds to
1,116,000 ms. All 467 original-platform cues end before the private media
does. The first starts at 100 ms and the last ends at 1,114,463 ms.
These observations establish duration/cue compatibility, not what was
actually spoken or whether each cue follows the correct speaker.

The YouTube video license field and the [Commons copy](https://commons.wikimedia.org/wiki/File:%E9%87%87%E8%AE%BFvivo_%26_MediaTek%E7%A0%94%E5%8F%91%E5%A4%A7%E4%BD%AC%EF%BC%9A%E8%93%9D%E5%8E%82%E4%B8%8E%E5%A4%A9%E7%8E%91%E5%90%88%E4%BD%9C%E8%83%8C%E5%90%8E%E7%9A%84%E6%95%85%E4%BA%8B.webm)
make this a plausible private development source. Commons retains an import
license-review notice. The Chinese caption author's grant and separately
required audio-use right have not been verified, so their inventory decisions
stay `unknown`. No subtitle/media bytes are committed or redistributed.

## Rejected pairing: Geekerwan ASUS ROG Ally

The [creator's ASUS video](https://www.youtube.com/watch?v=y3-4FgTmGIQ)
also reports a regular `zh-CN` SRT track, no automatic captions and the
creator's CC Attribution reuse option. Its current YouTube duration is
**1,375,000 ms (22:55)**. The retained [Commons video](https://commons.wikimedia.org/wiki/File:ASUS_ROG-Handheld-Leistungsanalyse_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_01.webm)
is **882,223 ms (14:42.223)**, a 492,777-ms discrepancy. The archived
268-cue SRT SHA-256 is
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`;
private media SHA-256 is
`9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1`.
The current YouTube track must not be paired with the shorter copy without
a separate edit/version map. The first extractor attempt failed before spawn
with `EPERM` and zero output; its report SHA-256 is
`62e6d8bb561bc5897c0b64773f8cae25031931bcaff6698062683e3ca58bcaec`.
The one separately frozen retry succeeded; raw metadata SHA-256 is
`167dff6ab4d59dc0b82e10a98a533a02203060af1abe7d935951c96a6d4f337b`.

## Admission and next action

The Vivo interview is the best matched **technical candidate** for one
10–20-minute scene. It is still `inspected_candidate`, with zero eligible
development/holdout cues and no human speech-alignment review. The next
source action is a private beginning/middle/end and speaker-boundary packet
from the pinned media and cue texts. A named Chinese listener must check
the actual words, timing and speaker changes before an eligible scene can be
claimed. An ASR comparison can flag mismatches but cannot substitute for
that record. Independent Russian adequacy review remains a later gate.

Executed commands: `task eval:data:youtube:asus:license:preflight`, the
first `inventory` (pre-spawn `EPERM`), `task
eval:data:youtube:asus:license:retry:preflight`, `task
eval:data:youtube:asus:license:retry`, `task
eval:data:youtube:vivo:license:preflight`, `task
eval:data:youtube:vivo:license:inventory`, `task
eval:data:youtube:vivo:caption:preflight`, `task
eval:data:youtube:vivo:caption:acquire`, `task inspect -- <private Vivo SRT>`,
`task eval:data:youtube:vivo:caption:report` and `task
eval:data:youtube:vivo:caption:check`. Metadata and caption acquisitions
used their declared single attempts; the raw replies and failures are
retained in ignored `.cache/eval/`.
