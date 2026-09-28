# Real SAPI speech in a synthetic media fixture

Status: technical `VOICE-02` exploration, not task completion, 29 September
2026 local. Auralis isolated branch `feat/real-tts-pilot` commits `ad33007`
(frozen fixture and Taskfile command) and `a468801` (retained output and
reports). The Auralis branch is local; the parent repository's other unpushed
work was not published.

The earlier two real Microsoft Irina Desktop SAPI WAVs are unchanged. Their
original 2,400/1,900 ms cue windows failed by 744/169 ms. The new *author-created
technical fixture* explicitly widens those windows to 3,500/2,500 ms with a
500 ms gap, without editing the selected translation or claiming an approved
speech adaptation. No natural video, source rights, independent review or
production mixer was involved.

`task voice:media:fixture:probe` verified pinned FFmpeg/ffprobe 8.1.2 and the
WAV hashes, then produced an 8.000 s, 640×360 H.264/mono AAC MP4. The output
SHA-256 is
`84f25b74c8e9ca39bf7b461608e47b4ff869ff3c0a6fbf07b6b7fca1bc16bd4e`
(73,261 bytes). FFmpeg decoded both streams; 22,050 Hz audio RMS was 1,055.4
in the first speech window, 0 in the declared gap and 1,632.7 in the second.
No decoded sample clipped. `task voice:media:fixture:play` completed in local
FFplay 8.1.2 on the exact output hash. This is player-process evidence, not
a recorded human listening judgment. `task docs:check` passed after fixing a
broken link in the Auralis handoff note.

The MP4, Chinese/Russian SRT timing fixtures, manifest, render report and
playback record are retained under Auralis
`evidence/voice/2026-09-29-sapi-media-fixture/` at `a468801`. The original
failed-fit WAVs remain in `evidence/voice/2026-09-28-sapi-probe/`.
Redistribution rights for the synthesized voice have not been established,
so the media file is local and is not embedded in the public Translate report.
No A1–A6 gate passes: reviewed selected-result lineage, approved speech,
natural video, multiple distinct scenes, human listening, full-file durability
and delivered-media consumer checks remain open.
