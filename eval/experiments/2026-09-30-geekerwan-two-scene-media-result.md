# Two matched Geekerwan 240p videos and six unlistened audio samples

Date: 30 September 2026. Task: `DATA-03`. The [bounded source/media plan](2026-09-30-geekerwan-two-scene-source-plan.md)
and downloader were committed at Translate `a09bbc4b1240482fc2aeade15931b10977ff65ab`
before media acquisition. `task eval:data:commons:geekerwan:media:acquire`
rechecked the two exact original SRT hashes, then made one Commons `videoinfo`
API GET and one 240p derivative GET per source. All four returned HTTP 200;
there were no retries. Raw API responses, reports and original derivative bytes
remain in ignored `.cache/eval/commons-geekerwan-two-media/`.

| Candidate | 240p bytes | Media SHA-256 | Acquisition report SHA-256 | FFprobe duration | Source SRT SHA-256 |
| --- | ---: | --- | --- | ---: | --- |
| ASUS ROG Ally | 27,074,541 | `9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1` | `d45bc1e6ba2a617cb9a9fbe26c1c1c5f9d22eaad8c42872ffc02fe827df77e7d` | 882,223 ms | `923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b` |
| Huawei Kirin 9010 | 18,730,911 | `2911c8a14b6da9fa62d46235aa09a1b240ee1409ec8e28336edc7ed90c9af586` | `5c4ab3ecb8ce205f0ef4f876671e51d55e922e375529104771078e55ff5a539b` | 761,818 ms | `57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb` |

`task eval:data:commons:geekerwan:media:streams-and-samples` checked both
acquisition reports and exact video hashes with pinned FFprobe `9df3b0b5…a55015`
and FFmpeg `ad8f211b…5942e`. Each video has one VP9 426×240 stream and one
Opus stereo 48-kHz stream. It decoded start, middle and end windows to private
16-kHz mono PCM WAVs. The first check only proved RIFF, nonzero samples and
approximate byte size. Its reports (`310551c9…17b0708`, `2948929d…3432f27`)
remain. Because requested 12-second windows yielded shorter WAVs, the checker
was corrected to probe and retain actual decoded durations. The second check
passed; exact reports are ASUS `fb7a77c840cb2fffd6be2a5301cf698b7dd098c5a553f81b0790f4715b471b91`
and Kirin `af3e6699478be47d03412722e0501687a9046618018c1c99bc1eebc24f440211`.

| Candidate | Source window | Decoded WAV duration | WAV SHA-256 |
| --- | ---: | ---: | --- |
| ASUS start | 0–12 s requested | 10,493 ms | `a3d1fe7ce9f57bf1a6a443945c606755b387ecf40bb7e94bf6cf466a6ef3e8d0` |
| ASUS middle | 440–452 s | 11,995 ms | `370270222a9c9accf4555519cfd416a46a9204ff4f3ad133c271e4020f23cf78` |
| ASUS end | 870–882 s | 11,997 ms | `84433b8c345072b83f8248e3d43d73c321eae21054e9e9d69807861f6c9d146e` |
| Kirin start | 0–12 s requested | 11,613 ms | `8218abc5a56829b678350f5c9b9b84e7e17ae8b14f6f34d0e7ad3377abf7bd7d` |
| Kirin middle | 380–392 s | 12,000 ms | `dcf3f4996e076e3a314171517905b40b6f4ccf5552380867c4dfebb2adb8c291` |
| Kirin end | 750–762 s requested | 11,033 ms | `c932d8ee3cb637a55173b3cda1e02c96e7e97f7b9efc5e3ab65245d9b488a379` |

These WAVs are for a human to compare audible language and approximate source
cue timing at beginning, middle and end. No person has reported listening.
`task eval:data:commons:geekerwan:review-packet` joined the three Geekerwan
sources (Vivo, ASUS and Kirin), their nine exact-hash WAVs and the strictly
parsed Chinese cues overlapping each requested window into one ignored private
packet at `.cache/eval/geekerwan-source-review/packet-6f049af4-4915-4375-ae0a-787979cb246d/packet.json`.
Its SHA-256 is `64619e54d228571bed59fb356a5b1fc80d328fa8e4c163fb90fa3dce9eb5eb5f`;
it explicitly records zero human reviews and no Russian reference. It is
available locally for a named bilingual/source-audio reviewer, not for public
redistribution.
Decodability and nonzero PCM cannot establish Chinese speech, cue alignment,
speaker mapping, absence of problematic licensed material or suitability for a
spoken script. The Commons file pages claim CC BY 3.0 but retain the import
license-review notice; caption authorship and separate audio rights still need
review. Both sources remain unassigned `inspected_candidate` with zero eligible
development/holdout cues. No model inference or TTS used these new sources.
