# Mandarin finance video: no advertised Chinese caption track

Date: 1 October 2026. Backlog: partial `DATA-03` source-screening evidence.
The [predeclared plan](2026-10-01-xiaolin-source-inventory-plan.md) and
Taskfile probe were committed at `1904ce2` before the metadata request.

The [creator's video](https://www.youtube.com/watch?v=i0hac3c_xhs) is 776
seconds (12:56), uploaded by 小Lin说 on 5 June 2021. Its
[Commons file page](https://commons.wikimedia.org/wiki/File:%E3%80%90%E7%89%B9%E5%88%AB%E7%AF%87%E3%80%91%E7%9C%9F%E5%AE%9E%E7%89%88%E5%8D%8E%E5%B0%94%E8%A1%97%E4%B9%8B%E7%8B%BC_-_%E4%B8%80%E9%A9%AC%E5%9F%BA%E9%87%91_1MDB_Scandal.webm)
categorizes it as Mandarin, claims CC BY 3.0 for the imported video and
explicitly marks that license **not reviewed**. The checked `yt-dlp`
2026.07.04 executable has SHA-256
`52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`.

The first `task eval:data:youtube:xiaolin:inventory` failed at local
`spawn EPERM` before an extractor or network call. The initial implementation
also failed to retain the exception. After adding a caught-spawn path, the
same local failure was reproduced and retained in ignored
`.cache/eval/youtube-xiaolin/inventory-wyKdOp/`, record SHA-256
`b936f1871664d46dae46424ac2b6dbf278b4939bd4653301d8c5735e3f0bd7d3`.
The failed record has zero stdout/stderr bytes and no metadata. Four process
capture checks now cover synchronous denial, asynchronous child error, normal
completion and an output-budget breach.

One permission-adjusted invocation then succeeded in 3.4 seconds without a
media or subtitle download. It returned 88,599 metadata bytes, SHA-256
`0ceeca3130da6b6c15803b27b68f8c70481da39cda8985952c7883cb1e0c7ca4`;
the record SHA-256 is
`480c032761e7720c9d2eda9ecdb3848d185b6ad4855d5b474f9ea9bff1036f55`.
The complete extractor output and record are retained privately in
`.cache/eval/youtube-xiaolin/inventory-nVDJYN/`. It reported `subtitles={}`
and `automatic_captions={}`. That observation does not prove that no caption
exists anywhere, but it supplies no reproducible Chinese subtitle track for
this source. No caption or reference rights were established.

This video is **not admitted** into the development corpus. It adds zero
inspected subtitle cues and zero eligible cues; the existing nine registered
candidates remain at 1,850 inspected and zero eligible. No model request,
comparison, reference creation, TTS, playback or human quality claim followed.
The source can only be reconsidered after an identifiable, rights-checked
Chinese caption becomes available. `task eval:data:youtube:xiaolin:preflight`,
`task eval:data:youtube:xiaolin:check` and `task plan:check` are the offline
rechecks for this record.
