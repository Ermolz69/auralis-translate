# Restaurant media duration check: bounded acquisition plan

Date: 1 October 2026. Backlog: partial `DATA-03` and `DATA-05`.

Question: does the actual Commons 426x240 VP9/Opus derivative of the
[restaurant video](https://commons.wikimedia.org/wiki/File:Inside_One_Of_Singapore%E2%80%99s_Most_Refined_Cantonese_Kitchen_-_Behind_The_Plate_(Turn_on_CC).webm)
end near the catalog's 12:18 display, and can the first 263 Chinese SRT cues
fit that actual duration? The immutable 271-cue caption is revision
`1200692574`, SHA-256
`077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967`.
There is no reference, model request, split assignment, or quality score in
this inspection. Earlier nine source candidates and their zero eligible cues
are the baseline.

`task eval:data:commons:sethlui:media:acquire` makes at most one Commons
`videoinfo` GET (90 seconds, 1 MiB response limit) and one selected derivative
GET (10 minutes, 60 MiB response limit), with no retry or redirect. It pins
the source SRT before either request and retains raw metadata, received media,
hashes and failures privately in ignored `.cache/eval/commons-sethlui-media/`.
The selected derivative must be Commons-hosted 426x240 VP9/Opus. Stop if the
metadata is absent, selection ambiguous, size over budget, network fails or
bytes differ from declared length. The original SRT is never edited.

On successful download, `task eval:data:commons:sethlui:media:derive` checks
the media, acquisition record, caption and FFprobe executable hashes, then
runs one local FFprobe process (30 seconds, 1 MiB output). It retains the raw
probe output and failure. If and only if cue 263 fits the measured stream and
cue 264 starts beyond it, it writes a private first-263-cue derivative with
an exact original-to-derived mapping and eight recorded exclusions. A strict
CLI syntax check is then required; stream containment does not verify speech.
Actual Chinese speech, timing alignment, caption rights, speaker turns and
independent Chinese-to-Russian reference remain unverified. The raw 271-cue
caption cannot be admitted as a matched complete scene.
