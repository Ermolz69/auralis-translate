# Two further Geekerwan Chinese caption candidates: 572 strict cues

Date: 30 September 2026. Task: `DATA-03`. The [predeclared source plan](2026-09-30-geekerwan-two-scene-source-plan.md)
was committed at Translate `79e43e75ae36e61fdd3634b7ea6e14789e433281` before
acquisition. `task eval:data:commons:geekerwan:captions:acquire` made exactly one
Commons `action=raw` GET for each pinned revision, returned HTTP 200 twice, and
stored the unmodified bytes privately. No retry, model call or TTS was made.

| Candidate | Revision | Bytes | SHA-256 | Strict SRT cues | Report SHA-256 |
| --- | ---: | ---: | --- | ---: | --- |
| [ASUS ROG Ally](https://commons.wikimedia.org/wiki/TimedText:ASUS_ROG-Handheld-Leistungsanalyse_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_01.webm.zh.srt) | `892592485` | 21,354 | `923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b` | 268 | `e78f6fba3e5be693e417c360e5515f149fb3008825d72de2e40ea9a841aef696` |
| [Huawei Kirin 9010](https://commons.wikimedia.org/wiki/TimedText:Huawei_Kirin_9010_in-depth_analysis_compared_to_9000s_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_19.webm.zh.srt) | `880535591` | 22,193 | `57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb` | 304 | `c4d12fbaa6d69d00f6c1bfb2f211e3a761cd9b4448db0504210dd06cdaf39661` |

`task inspect -- <private source>` accepted both as strict SRT. The first attempt
to run the batched `task eval:data:commons:geekerwan:captions:check` failed with
sandbox `spawn EPERM` before the strict CLI process started; a same-byte rerun
passed: exact acquisition report and source hashes, stable private copies,
268/304 ordered internal cue IDs, and 572/572 candidate cues with zero eligible.
The [non-admitted inventory](../corpora/commons-geekerwan-two-scenes-candidate-v1.json)
keeps both sources unassigned and all rights unknown. Original response bytes and
reports are in ignored `.cache/eval/commons-geekerwan-two-scenes/`; stable copies
are in ignored `.cache/eval/commons-asus-rog-ally-892592485/` and
`.cache/eval/commons-huawei-kirin-9010-880535591/`.

The ASUS caption ends at 14:39.553 and the Kirin caption ends at 12:38.784;
both durations fit the audio-scene range if the matched media proves suitable.
The [ASUS file page](https://commons.wikimedia.org/wiki/File:ASUS_ROG-Handheld-Leistungsanalyse_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_01.webm)
and [Kirin file page](https://commons.wikimedia.org/wiki/File:Huawei_Kirin_9010_in-depth_analysis_compared_to_9000s_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_19.webm)
claim CC BY 3.0 for the videos but mark the imported license unreviewed. Caption
authorship/license, Chinese speech alignment, speakers and independent review are
unverified. These 572 cues add **zero eligible** cues to `DATA-03` and do not
approve any translation or dubbing script. The separate matched-media budget in
the plan is the next source-inspection step.
