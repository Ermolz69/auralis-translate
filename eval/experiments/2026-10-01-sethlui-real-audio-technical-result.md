# Chinese restaurant real-TTS and full-media technical result

Date: 1 October 2026. This continues the [frozen PLAN-03 scope](2026-09-28-goal-scope-v1.md)
and the [same-source 7B structural translation](2026-10-01-sethlui-json-tail-length-retry-result.md).
The separate Auralis `feat/real-tts-pilot` worktree at local commit `f4e1c1d`
holds the frozen speech/media plans, Taskfile probes, independent checker and
private output. The source subtitle, translated draft and matched source video
have the SHA-256 identities in the [redacted summary](../reports/2026-10-01-sethlui-real-audio-summary.json).
No model answer, source text, voice clip or copyrighted media is published here.

The first SAPI inventory launch failed at `spawn EPERM` before synthesis and
was retained. One permission-adjusted retry verified the same hashes and
generated 263/263 real `Microsoft Irina Desktop` 22,050-Hz mono 16-bit WAVs in
159,669 ms. An independent read-only check rehashed and decoded every WAV,
matched it to its original cue and measured zero clipped samples. **256/263**
speech durations exceed the source cue windows, **236/263** starts overlap the
preceding ongoing speech, and the maximum overrun is **5,913 ms**. These are
failed fit measurements, not accepted Russian dubbing.

One 28,687-ms FFmpeg assembly used the pinned source VP9/Opus video, all real
SAPI WAVs, the frozen overlap and mix policy, copied video and 128-kbit/s Opus
output. The 32,317,227-byte private MKV SHA-256 is
`e08037ee4cfd35f0c38014cfc30b04fefbc1546827845fb1cb8086c3d851a30b`.
FFprobe and a full decode measured a 738,064-ms container and 738,056-ms
audio track against a 738,056-ms source, 36,904 audio packets, maximum 1-ms
packet gap and zero clipped output samples. One full `ffplay -autoexit -nodisp`
process completed in 742,979 ms; its report SHA-256 is
`23373cecea85f5cafc7f50d7b6619a67a18696b513d81ceae786b26e4a8f7366`.
`task voice:natural:sethlui:media:check` independently rehashed the source,
263 WAVs, speech reports, media, speech track and playback report, and
recomputed the coverage and packet controls. It passed. The Auralis private
media path is `.cache/voice/natural-sethlui-media-v1/media-run-92c8d2cd-079f-4811-a517-49f0df4422b0/natural-sethlui-technical.mkv`
inside the dedicated worktree; it is not a public artifact.

This is a technical process playback, with **zero human listeners**. It cannot
establish intelligibility, pronunciation, mixing quality, speaker assignment,
semantic fidelity or natural scene continuity. The draft still contains the
known dim sum role error and three renderings of one venue name (`REG-044`).
The Chinese speech alignment and source/media usage rights have not been
admitted. No independent Chinese–Russian review, approved spoken script or
managed selected-result handoff exists for this source. The one 12:18 video
does not meet the required three reviewed 10–20-minute scenes. The Auralis
worktree retained its earlier failed SAPI launch and historical ASUS media
failures; neither was replaced by this result. `VOICE-02`/`VOICE-03`/`VOICE-06`
gain partial engineering evidence while G1–G9/A1–A6 and the release decision
remain open.
