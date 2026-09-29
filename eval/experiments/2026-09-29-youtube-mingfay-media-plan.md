# Mingfay media: one bounded private download

Date: 29 September 2026. Task: DATA-03 and prospective VOICE-01. The user
authorized finding a YouTube Chinese-subtitle source for testing on this
machine. This is private source/media investigation, not redistribution or
audio acceptance. The [caption candidate](2026-09-29-youtube-mingfay-caption-candidate.md)
already has 230 strictly inspected Chinese-only derivative cues, but speech
alignment and audio use remain unapproved.

The frozen video ID is `0hoTgJKET7Q`. The previously retained extractor JSON
has SHA-256
`2BE4F02CCD4C92FA1A86E051ADA703C07810E88F548467312D42F6B9614C6F00`.
It advertises a single combined video/audio format ID `18`: MP4, 640×360,
H.264 `avc1.42001E`, AAC `mp4a.40.2`, 57,194,836 bytes. The installed
`yt-dlp` 2026.07.04 SHA-256 is
`52FE3C26DCF71FBDC85B528589020BB0B8E383155CFA81B64DD447BBE35E24B8`.

`task eval:data:youtube:mingfay:media:acquire` first checks those identities.
It then permits one `yt-dlp` invocation with exact format `18`, no playlist,
zero extractor/download/fragment retries, a three-minute wall cap, one MiB
combined command-output cap and an 80 MiB download cap. It uses a fresh
ignored `.cache/eval/youtube-mingfay/media-*` directory and retains the
complete media or any partial/failure and exact command outcome. A changed
format, ID or metadata requires a new plan. No alternate video is substituted
on failure.

After acquisition, inspect exact SHA-256, byte count, streams, duration and
subtitle/audio synchronization with pinned local tools. No caption/media
bytes enter GitHub or Pages. A process playback or waveform check is not
human listening; voice release gates still require approved audio rights,
independent translation review and actual listener/consumer evidence.
