# Two further Geekerwan Chinese scene candidates: bounded source acquisition

Date: 30 September 2026. Task: `DATA-03`. This source-discovery probe does not admit
either source to development, holdout, translation-quality scoring or dubbing.
The existing 18:36 Vivo interview is a separate potential scene. The two new
Commons pages describe an ASUS ROG Ally review (14:42, 268 Chinese cues on the
page) and a Huawei Kirin 9010 analysis (12:42, 304 Chinese cues on the page).
Both are from Geekerwan, so whole-video deduplication and scene independence must
be checked before any split assignment.

The exact TimedText revisions to request once each are:

| Candidate | TimedText revision | Media page |
| --- | --- | --- |
| ASUS ROG Ally | `892592485` | `File:ASUS_ROG-Handheld-Leistungsanalyse_(极客湾Geekerwan)_01.webm` |
| Huawei Kirin 9010 | `880535591` | `File:Huawei_Kirin_9010_in-depth_analysis_compared_to_9000s_(极客湾Geekerwan)_19.webm` |

`task eval:data:commons:geekerwan:captions:acquire` makes at most two HTTPS
`action=raw` GETs, no retry, with a 90-second and 256-KiB limit per response.
It retains exact response bytes and a separate report per attempt in ignored
`.cache/eval/commons-geekerwan-two-scenes/`. A successful byte fetch is followed
by strict SRT inspection and a non-admitted source inventory. Failed responses
and parser rejections remain retained; no edit to source bytes is permitted.

The Commons media pages claim CC BY 3.0 for both videos but retain a license-review
needed notice. The caption text's authorship/license, real Chinese speech and cue
alignment, speakers, sound quality, scene boundaries and independent reviewers
remain unknown. Do not publish the source/media, approve a spoken script or count
these cues as eligible until those checks are recorded. Do not run model inference
or TTS under this acquisition budget.

## Matched-media continuation

After the exact caption hashes and strict cue counts are checked, one bounded
media pass may make at most two Commons `videoinfo` API GETs and two matching 240p
VP9/Opus derivative GETs (one of each per source). The derivative must be HTTPS
under `upload.wikimedia.org/wikipedia/commons/transcoded/`, 426×240, and have a
declared size of at most 100 MiB per source. Limit each metadata response to 1 MiB
and 90 seconds; limit each media response to 100 MiB and 10 minutes. No retries.
Retain raw API JSON, original derivative bytes, SHA-256, times and failed reports
privately. Only after media checks may three 12-second source-audio samples per
source be decoded for human speech/alignment review. Decoding alone is not
listening or proof of alignment.
