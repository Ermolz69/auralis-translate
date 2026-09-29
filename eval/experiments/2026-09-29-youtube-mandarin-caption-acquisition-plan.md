# Mingfay Mandarin caption: bounded private acquisition

Date: 29 September 2026. Task: DATA-03. The user authorized finding a
YouTube Chinese subtitle source for tests on this machine. This step is
private acquisition, not source admission, redistribution, or a human quality
assessment. It follows the [frozen metadata inventory](2026-09-29-youtube-mandarin-source-inventory-plan.md).

The candidate is video `0hoTgJKET7Q` (13:47), with a **regular subtitle**
track keyed `zh-CN` and advertised `srt` format. The exact extractor response
is retained outside Git at `.cache/eval/youtube-mingfay/inventory-n0W3n5/`
with SHA-256
`2BE4F02CCD4C92FA1A86E051ADA703C07810E88F548467312D42F6B9614C6F00`.
The exact signed SRT URL in that response has SHA-256
`8362542CBCEE5F4A424CAEFD810A4BC9400E04433812C5E1425F9AB0AF1C5443`;
the URL itself stays private. The script requires the YouTube timed-text host,
video ID, `lang=zh-CN` and `fmt=srt`; it cannot substitute an auto caption or
another language.

Run `task eval:data:youtube:mingfay:caption:preflight`, then one
`task eval:data:youtube:mingfay:caption:acquire`. The latter makes at most one
HTTP request, no retry, with a 90-second wall limit and 2 MiB response cap.
It preserves response bytes (including a failed HTTP body) and outcome in a
fresh ignored `.cache/eval/youtube-mingfay/caption-*` directory. A failure
must be kept; any alternate retrieval requires a separately recorded plan.

After retrieval, verify raw SHA-256, strict parser acceptance, cue count,
start/middle/end text and timing, Chinese versus Pinyin/English content, and
audio alignment separately. The platform metadata has no license field. Do
not publish raw captions/media, infer usage rights, create a Russian reference
from another language, or treat the source as a sealed holdout. A real model
comparison requires a further frozen development experiment.

## Frozen derivative decision after source inspection

The one acquired response was HTTP 200, 32,400 bytes, SHA-256
`A875C0A84AB0C3A9B44A1B5A2BE0C6F3D5B885ED82D241D386057C0DBD5AB436`.
The strict parser accepted all 230 cues. Every cue has three text lines:
Pinyin, one Han-containing Chinese line, then English. Cue 230 is unique and
has an earlier start (`12:41.966`) than cue 229 (`13:43.833`). The first
sandboxed CLI launch failed with `EPERM`; a permission-adjusted rerun passed.
Both exact attempts remain in ignored storage.

For a **private development derivative only**, `task
eval:data:youtube:mingfay:caption:derive` requires that raw hash, exactly 230
cues, three lines with Han characters only in the middle line, unique numeric
labels and timings within 13:47. It copies the middle line verbatim, sorts by
start time with original position as tie breaker, assigns new sequential
labels and writes a complete original-to-derived cue map. The raw caption
remains immutable. The derivative is a new source artifact, not a correction
to the published creator track or an approved reference. A separate strict
parser check and speech alignment review must follow; observed subtitle
errors and rights uncertainty remain visible.
