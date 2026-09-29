# Creative Commons and Commerce subtitle candidate

Status: inspected `DATA-03` candidate, 29 September 2026. This is a
candidate investigation, not an admitted development source or holdout.

## Frozen acquisition plan

- Identity: Commons TimedText revision `906218083`, Chinese SRT for the
  2007 Creative Commons and Commerce video.
- Source revision: `https://commons.wikimedia.org/w/index.php?title=TimedText:Creative_Commons_and_Commerce.ogv.zh.srt&oldid=906218083&action=raw`.
- Expected SHA-256: `df2af6ad32f12b55c3067469228d3b9674b7c35e7d8540acd294dd0f986fe46f`, measured once with a declared project User-Agent before the pinned acquisition task was written.
- Split: unassigned; no model inference or reference generation. One HTTP GET,
  30-second deadline, 256-KiB response limit, no retries. Stop on transport,
  revision/hash, strict parser or ordered-cue mismatch. Retain exact raw bytes
  only in ignored `.cache/eval/commons-cc-commerce-906218083/`.
- Expected structure from the public page: 123 cues over 9:56. Strict CLI
  parsing, scene/speech alignment and eligible-cue count must be measured
  separately; a page rendering is not the exact SRT file.

The [file description](https://commons.wikimedia.org/wiki/File:Creative_Commons_and_Commerce.ogv)
labels the media CC BY 3.0 and 7.24 MB. The
[TimedText page](https://commons.wikimedia.org/wiki/TimedText:Creative_Commons_and_Commerce.ogv.zh.srt)
states that unstructured Commons text uses CC BY-SA with possible additional
terms. These are source claims, not an independent provenance review of the
Chinese translation. The video has English narration; its Chinese subtitle is
a translated text source, so original Chinese speech alignment cannot be
inferred. Rights, speaker/scene boundaries, reference and human quality review
remain unapproved in the candidate manifest.

The [Commons revision metadata](https://commons.wikimedia.org/w/api.php?action=query&prop=revisions&titles=TimedText%3ACreative_Commons_and_Commerce.ogv.zh.srt&rvprop=ids%7Ctimestamp%7Cuser%7Ccomment%7Csize&rvlimit=50&format=json)
returns exactly one revision: `906218083`, created at
`2024-08-03T16:45:24Z` by `Prototyperspective`, with the comment
`added machine transcribed subtitles` and size 14,115 bytes. The comment is
an uploader description, not verified evidence of the Chinese text's generation
method or accuracy. No caption translator, independent source-language review,
or text-specific license was established. The source therefore remains excluded
from Chinese-speech alignment and the real dubbing pilot; it remains an
unassigned translation-text candidate with zero eligible cues.

## Observed result

`task eval:data:commons:cc-commerce:acquire` retained 14,115 exact raw bytes
under the frozen SHA-256 above. The cache file's creation time was
`2026-09-29T17:07:45Z`. `task eval:data:commons:cc-commerce:inspect` rechecked
the retained hash, built the offline CLI, and parsed 123 ordered strict-SRT
cues. Its first sandbox run could not spawn the local CLI (`EPERM`); the same
Taskfile command passed with child-process permission. No model request,
translation or media download occurred. The acquisition had one HTTP GET,
no retry and remained below its 256-KiB/30-second bounds.
An earlier read-only request with the default HTTP client received 403; a
declared project User-Agent returned 200 and the measured hash. The pinned
Taskfile acquisition used that User-Agent and did not retry a failed transfer.
`task docs:check`, `task plan:check`, `task eval:data:check`,
`task site:build`, `task site:check` and both new Node syntax checks passed.
The data check validated three source inventories and all seven semantic
inventory tests. The site build preserved prior measurements and added this
candidate as a non-admitted finding.

This source is 9:56 and therefore cannot alone satisfy a 10–20-minute voice
scene or the natural long-file release gate. All 123 cues remain unassigned,
without speaker/scene, independent reference, rights admission or human review.
The source is not used as a sealed holdout or presented as a quality result.
