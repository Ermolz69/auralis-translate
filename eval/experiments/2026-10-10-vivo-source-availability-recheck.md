# Vivo source availability recheck

Date: 10 October 2026. Partial `DATA-03` retention evidence for the selected
[18:36 YouTube scene](2026-10-09-youtube-chinese-scene-selection-result.md).
This was read-only: no media or caption acquisition, ASR, translation or TTS
request occurred. It does not supersede the earlier source-version report.

The current primary checkout retains the Commons caption revision linked in
the source-selection report
at SHA-256 `8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000`
and the 240p media at SHA-256
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
`task eval:data:commons:vivo:candidate:check` passed: 467 strictly parsed
candidate cues, zero admitted cues. `task inspect --
.cache/eval/commons-vivo-caption/attempt-0a204ad7-002c-4e3c-8ea6-3f1a630871b1/source.zh.srt`
passed. `task eval:data:commons:vivo:media:streams` passed after a sandbox
child-process `EPERM` on the first attempt: 1,115,570 ms, VP9 426×240,
Opus stereo 48 kHz. The three retained 12-second WAVs at 0, 563 and 1,102
seconds match their earlier SHA-256 values
`1774c0fe3449dd594af58cf4ebf8f037cc0df0b0812f6727e7338c71d680e402`,
`851cf0e806a10b0b1e85eefe39229fc4eb7c551a3f331693730afd4ac9c837d3`
and `1259b66490f21ef5a43d88feacbb5238a64cfbb220eb512e260d896b47d0c970`.

The earlier original-platform YouTube SRT SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`
was previously compared with the Commons copy: 467/467 cue texts matched,
and eight timing rows differed by no more than 1 ms. The ignored original
YouTube SRT at its frozen path and the three-window ASR raw JSON are **not
present in the current primary or publication checkout**. Thus today's
`task eval:data:youtube:vivo:caption:check` and
`task eval:data:youtube:vivo:asr:check` both failed on missing private input.
The public frozen machine reports remain, but this checkout cannot currently
recompute those two checks. Do not describe them as freshly passed. Do not
substitute the Commons SRT bytes for the original-platform input or silently
reacquire it under the old experiment identity. A separately frozen source
reacquisition and byte/version comparison is needed if repeatability of the
YouTube-original check is required.

This recheck did not listen to the Chinese speech and does not verify exact
words, speaker boundaries, caption authorship or audio/subtitle rights. The
scene remains an inspected technical candidate for private experiments only;
its language and release admission counts stay zero. Rollback is to ignore
this availability observation while retaining both earlier immutable public
reports and the current Commons SRT/media hashes; no accepted translation or
audio result changed.
