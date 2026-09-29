# Mingfay neighborhood walk: inspected Mandarin caption candidate

Date: 29 September 2026. Backlog: DATA-03 `in_progress`. This is a private
development candidate, not an admitted source, release holdout, Russian
reference or audio acceptance result.

## Source and bounded acquisition

The [creator's video](https://www.youtube.com/watch?v=0hoTgJKET7Q) is 13:47,
ID `0hoTgJKET7Q`, uploaded 8 September 2026 by Mingfay Chinese. The pinned
`yt-dlp` 2026.07.04 executable SHA-256 is
`52FE3C26DCF71FBDC85B528589020BB0B8E383155CFA81B64DD447BBE35E24B8`.
One metadata-only inventory request succeeded with response SHA-256
`2BE4F02CCD4C92FA1A86E051ADA703C07810E88F548467312D42F6B9614C6F00`.
It advertised a regular `zh-CN` SRT subtitle track separately from automatic
captions. Its license field was null. The [predeclared metadata plan](2026-09-29-youtube-mandarin-source-inventory-plan.md)
and [caption plan](2026-09-29-youtube-mandarin-caption-acquisition-plan.md)
fix the exact ID, signed track-URL hash, one-request budgets and private storage.

The single caption GET returned HTTP 200 in 0.212 seconds: 32,400 bytes,
SHA-256 `A875C0A84AB0C3A9B44A1B5A2BE0C6F3D5B885ED82D241D386057C0DBD5AB436`.
It stayed below the 2 MiB / 90-second bounds; no retry, media or other track
was downloaded. The raw response and acquisition record remain outside Git
in `.cache/eval/youtube-mingfay/caption-Vb3TuT/`.

## Exact structure and derivative

`task eval:data:youtube:mingfay:caption:inspect` observed 230 strict-SRT
blocks, 230 blocks with Pinyin / Han Chinese / English text lines, and 230
blocks with exactly one Han-containing line. The first/middle/final raw
labels start at 0.633 / 409.133 / 761.966 seconds. The unique raw cue 230
appears after cue 229 in the file even though its 761.966-second start is
earlier than cue 229's 823.833-second start. The strict CLI accepts the
file's 230 cues and exact raw hash; acceptance of its syntax does not make
its trilingual text a Chinese-only input.

The source-specific derivative policy copies only the middle Chinese line,
sorts by original start time with a stable tie break, and assigns sequential
labels with a complete old-to-new cue map. The raw response is unchanged.
`task eval:data:youtube:mingfay:caption:derive` produced 14,321 bytes,
SHA-256 `42109FC054CBA93B0EF343853628B6A248B31664786D579BDEFA415CCAACF9EE`.
Twenty labels moved because the out-of-order raw cue 230 is now derived cue
211, at 761.966–764.200 seconds. A second derivation check recomputed the
bytes and full mapping from the raw hash; the strict CLI parsed all 230
derived cues with that exact digest. Authored tests cover the minimal
retrograde case and related missing/moved Chinese lines, duplicate labels
and out-of-media timing. First, an inspector launch was denied by the
sandbox (`EPERM`); the failed output remains under the same private source
directory. The permission-adjusted rerun passed, as did derivative inspection.

The immutable candidate inventory is
[youtube-mingfay-candidate-v1.json](../corpora/youtube-mingfay-candidate-v1.json).
`task eval:data:youtube:mingfay:candidate:check` verifies the registered
private bytes and reports **230 inspected, 0 eligible** cues. The four prior
Commons candidates retain their 488 inspected, 0 eligible cues; the combined
technical inventory is now five candidates and 718 inspected cues. This is
not a quality denominator. Subtitle and audio rights, speech alignment,
scene/speaker boundaries, independent Chinese–Russian review and Russian
reference rights are unresolved. No natural translation, TTS, media playback,
human listening or clean-install result is claimed by this acquisition.

The raw source, derivative, cue text and signed URL are not published. The
exact checks run were `task eval:data:youtube:mingfay:inventory`,
`task eval:data:youtube:mingfay:caption:acquire`,
`task eval:data:youtube:mingfay:caption:inspect`,
`task eval:data:youtube:mingfay:caption:derive:check`,
`task eval:data:youtube:mingfay:caption:derive`,
`task eval:data:youtube:mingfay:derivative:inspect`,
`task eval:data:youtube:mingfay:candidate:check` and `task eval:data:check`.
All passed in the final permitted environment; the initial CLI `EPERM`
failure is retained. These checks establish byte lineage and parser
coverage only.
