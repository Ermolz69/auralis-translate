# Recheck of the selected 18:36 Chinese YouTube scene

Date: 10 October 2026. Backlog: partial `DATA-03`. This reuses the frozen
[source selection](2026-10-09-youtube-chinese-scene-selection-result.md),
original files and three-window ASR screen. There was no new network
acquisition, model request or subtitle edit.

The selected creator upload is [Geekerwan's Vivo/MediaTek interview](https://www.youtube.com/watch?v=_G4e2p1p-is),
ID `_G4e2p1p-is`, with a measured 18:35.570 media copy. The original-platform
metadata SHA-256 `66624027735c409eb650ab218560836e630653855e90c858bf832ab3886ba329`
still identifies one **regular** `zh-CN` SRT track and no advertised YouTube
automatic tracks. The metadata does not establish who authored the text or
whether its timings were generated. The original-platform 467-cue SRT is
33,577 bytes, SHA-256 `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
The matched 240p WebM is SHA-256
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
All cue texts and identities match the separately retained Commons caption
revision, eight time rows differ by no more than 1 ms, and no cue ends past
this media. Original files remain private and unchanged.

The original local `task eval:data:youtube:vivo:caption:check` again passed
strict parsing and the full 467-cue version comparison. `task
eval:data:youtube:vivo:asr:check` again passed rehash and report validation
for independent 12-second audio windows at 00:00–00:12 (cues 1–5),
09:23–09:35 (233–238), and 18:22–18:34 (461–467). The transcripts and
captions agree on the scene topics and clause order, with recorded ASR errors.
The model was forced to Mandarin and no person listened. These 36 seconds
cover about 3.2% of the video; word-level timing, speaker assignment and
the other cues are not verified. The first check attempt in the clean
publication worktree failed because ignored private source/ASR files live in
the experiment worktree; both checks passed there against their original
frozen inputs. No files were copied to make a misleading fresh run.

The YouTube metadata calls the video Creative Commons Attribution, while the
[Commons media page](https://commons.wikimedia.org/wiki/File:%E9%87%87%E8%AE%BFvivo_%26_MediaTek%E7%A0%94%E5%8F%91%E5%A4%A7%E4%BD%AC%EF%BC%9A%E8%93%9D%E5%8E%82%E4%B8%8E%E5%A4%A9%E7%8E%91%E5%90%88%E4%BD%9C%E8%83%8C%E5%90%8E%E7%9A%84%E6%95%85%E4%BA%8B.webm)
still marks its import license unreviewed. The creator's
[Bilibili posting](https://www.bilibili.com/video/BV1Cs6UYHEQF/) also
displays a no-repost-without-authorization notice. That platform notice does
not by itself revoke the YouTube CC field, but it reinforces the need to
resolve the exact media, audio and subtitle-text grants before distributing
a derived video or caption corpus. No rights admission follows from this
recheck.

Decision: keep one version-matched, regular-caption 18:36 **private
development candidate** with zero release-admitted cues. It is already
sufficient to exercise long-file translation and technical TTS paths with
`needs_review` output. Before quality or public audio acceptance, obtain a
source-language speech/word/speaker check and a separate rights decision for
the Chinese captions and soundtrack. Preserve the current source and all
failed or unreviewed results.
