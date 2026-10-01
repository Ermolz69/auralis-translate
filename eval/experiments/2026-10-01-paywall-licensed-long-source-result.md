# Licensed long Chinese subtitle candidate with matched documentary media

Date: 1 October 2026. Partial `DATA-03`, `DATA-05`, `VOICE-01` source
evidence under the [caption](2026-10-01-paywall-chinese-caption-plan.md),
[metadata](2026-10-01-paywall-media-metadata-plan.md),
[media](2026-10-01-paywall-media-acquisition-plan.md) and
[audio-window](2026-10-01-paywall-audio-sampling-plan.md) plans. This is a
strictly parsed **candidate**, not an admitted language source, human-reviewed
reference, approved spoken script or audio-quality result.

## Provenance and exact bytes

The [film item](https://archive.org/details/PaywallTheBusinessOfScholarshipFinalMovieMastered)
names creator Jason Schmitt, English language and CC BY 4.0. The
[film subtitle repository](https://github.com/paywallthemovie/subtitles)
credits Sau-Chin Chen for the complete Traditional Chinese track and states
that the film and subtitles are CC BY 4.0. The direct Amara SRT returned
HTTP 403 here; the [Chinese subtitle repository](https://github.com/SCgeeker/Paywall_CH_Subtitles)
contains the plain YouTube-style SRT and repeats the license. `git ls-remote`
pinned its `master` revision to
`4b4ffc0cbafd1d08bc4e0974dbd5454967a4acf9` before the one bounded GET.
The present-day paywallthemovie.com domain was not used to verify rights.

| Item | Observed result |
| --- | --- |
| Exact Traditional Chinese SRT | 75,844 bytes; SHA-256 `3406fcd365446d727f31c4ecf576de6c3b5e168658c3f5d276fea8142ddb5a4b`; 880 ordered strict-SRT cues; first 10,000 ms, last end 3,745,164 ms; six overlapping adjacent pairs |
| Caption request | HTTP 200, one GET, 471 ms, 45-second/256-KiB cap; original saved privately in `.cache/eval/paywall-chinese-caption/caption-0pzS77/`; acquisition SHA-256 `4cafa0d85d67ffc24185ce1ff7ab21e735d7dc41d0f6ec6fe265ffec1ee3306c` |
| Archive metadata | 48,587 bytes; SHA-256 `f5948aba883c2e0cfac0ef8a8eef3e4693fac01cc094a8b5e809d7d3908db33c`; OGV derivative 294,354,909 bytes, expected MD5 `ca0820d330ff5c55f147c17ce95f5ab4`, SHA-1 `7f2590d2128823bf144de62f723c672b0fd086c9` |
| Exact OGV derivative | HTTP 302 + 200, one allowed Archive redirect, 143,512 ms, no retry; 294,354,909 bytes; MD5/SHA-1 matched; SHA-256 `1bc2e667d296cfb9d11ebdf4ecfec468e3c6fd2aa969f2f6bbfb3fbe46343fd0`; private `.cache/eval/paywall-media/media-TPwlPu/source.ogv` |
| Local FFprobe | 3,888,085 ms Ogg; 532×300 Theora video and 44.1-kHz stereo Vorbis audio; all 880 Chinese cues end within the video, zero overruns; media-check SHA-256 `a05c7f37f43c11312ca7ae75a02cea570aa10f2b642d6c35dd06ab7abe84b863` |

The original caption and video bytes are unchanged. A hash-identical private
candidate copy is used by the [non-admitted inventory](../corpora/paywall-chinese-candidate-v1.json).
Its subtitle and film/audio rights record the stated CC BY 4.0 grants and
required attribution; reference rights remain unknown. The corpus validator
was corrected so a candidate may record independently verified source rights
without pretending its cues were aligned or reviewed. The permanent test
ensures approved subtitle/audio rights alone still contribute **zero eligible
cues**, and an unknown right cannot authorize use.

## Three source-audio windows

Exactly three 20-second mono PCM windows decoded from the original OGV in
fixed beginning/middle/end positions. No model, translation, reference or
audio-quality judgment selected them. The strengthened check measures PCM
durations of 20,000, 20,000 and 19,991 ms. Private report SHA-256 is
`93f43fab59eadcd15f9e27b95c5060a7e35305ad83c8b019771b4eb00d6fb1a3`;
the first less detailed report SHA-256
`e6470d617fec4ddd56c47daf937bd457f3041129cfd63b57cf55050b9be40a1e`
is retained.

| Start | Overlapping Chinese cue IDs | WAV SHA-256 | Decoder |
| --- | --- | --- | --- |
| 05:00 | 69–73 | `04a30ae0f5ea8683e474ee38b1b17dd1a175e9ae793159151071c13dc3f71e91` | completed |
| 32:00 | 465–470 | `7ecf264a31cf50a4cec085f518df5629ac8e0d224fa47894c4ecb1cf826e5dad` | completed |
| 60:00 | 861–864 | `3783a01fce4ed2039858c2751dbe5e51a433ad06f80394029a5ed86d122094fd` | completed |

The WAVs and exact cue text are retained only in ignored
`.cache/eval/paywall-audio-samples/samples-iW6TfF/`. No person has listened
to these windows or confirmed utterance-level alignment. The film is listed
as English-language speech with Chinese translated subtitles, so this source
can contribute Chinese subtitle development evidence but cannot establish a
Chinese-speech holdout. The opening URL slate and ending credits also need
explicit scene exclusions before quality scoring. Six cue overlaps require a
timing policy before TTS fit; they are not an accepted audio timeline.

## Observed checks and open gate

`task eval:data:paywall:caption:preflight`,
`task eval:data:paywall:caption:acquire`,
`task eval:data:paywall:caption:inspect`,
`task eval:data:paywall:media:inventory:preflight`,
`task eval:data:paywall:media:inventory`,
`task eval:data:paywall:media:acquire:preflight`,
`task eval:data:paywall:media:acquire`,
`task eval:data:paywall:media:check`,
`task eval:data:paywall:audio:sample`,
`task eval:data:paywall:candidate:check` and `task eval:data:check` passed.
The first sandboxed CLI inspection failed with `spawnSync EPERM`; that failed
report is retained privately, followed by a successful permitted inspection.
No conclusion was drawn from the failed process start.

The inventory is now **11 technical candidates, 2,993 inspected Chinese cues,
zero eligible development or holdout cues**. A rights-cleared source removes
one acquisition obstacle, but scene segmentation, source speech alignment,
independent Chinese–Russian references and reviewers, a final translation
candidate, approved spoken script and human listening remain outstanding.
Do not put this inspected development source into a sealed holdout or pass G3–G5
or A1–A6 from its license/structure alone.
