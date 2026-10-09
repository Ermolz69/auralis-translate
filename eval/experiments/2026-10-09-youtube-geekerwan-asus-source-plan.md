# ASUS ROG Ally original-platform source screen

Date: 9 October 2026. Backlog: `DATA-03`. This is an unassigned technical
candidate, not a development or release-holdout admission. The owner requested
YouTube Mandarin videos with regular, non-YouTube-generated Chinese captions.
The first candidate is the Geekerwan [original video](https://www.youtube.com/watch?v=y3-4FgTmGIQ),
linked from its [Commons media page](https://commons.wikimedia.org/wiki/File:ASUS_ROG-Handheld-Leistungsanalyse_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_01.webm).
The Commons page identifies the creator and reports a 14:42 copy under the
YouTube Creative Commons option, but still carries a license-review notice.
The existing Commons Chinese SRT revision `892592485` has 268 strict cues,
SHA-256 `923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
The matched private 240p video has SHA-256
`9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1`
and measured duration 882,223 ms. Original bytes remain private and immutable.

## Frozen metadata attempt

Identity: `DATA-03-youtube-geekerwan-asus-license-2026-10-09-v1`.
Use `yt-dlp` 2026.07.04, SHA-256
`52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`.
Run `task eval:data:youtube:asus:license:preflight`, then at most one
`task eval:data:youtube:asus:license:inventory`. The extractor gets one
metadata-only invocation for exact video ID `y3-4FgTmGIQ`: no subtitle/media
download, zero retries, 90 seconds, 12 MiB total output. Keep raw stdout,
stderr and signed track URLs only in ignored `.cache/eval/`. Retain failure
and stop this attempt even if the extractor, network or metadata fails.

Record upload identity, reported license and duration, and `subtitles` versus
`automatic_captions` language keys. A regular `zh` track demonstrates that
YouTube is serving a separately supplied caption track; it does not prove
that every word was written by a human. If the duration is compatible with
the private 882,223-ms copy, freeze a separate bounded caption acquisition
before requesting any signed URL. Compare exact caption bytes and cue timing
with the Commons SRT and retain both versions if different. Media and caption
rights require separate evidence; do not infer either from one license field.

Before claiming a usable 10–20-minute development scene, compare actual
Chinese speech to mapped source cues at the beginning, middle, end and scene
boundaries. Record reviewer identity, heard words and timing; machine checks
or nonzero PCM alone cannot make that claim. Russian references and
independent language review are later gates. No model or TTS call belongs to
this screen, and no source is promoted or publicly redistributed from it.

## One pre-spawn infrastructure retry

The first frozen attempt reached no extractor or network call: local process
creation returned `spawn EPERM`, with zero stdout/stderr. Its retained report
SHA-256 is
`62e6d8bb561bc5897c0b64773f8cae25031931bcaff6698062683e3ca58bcaec`.
One separate retry is authorized by this plan, using the same exact source,
media, executable, URL and limits. Its identity is
`DATA-03-youtube-geekerwan-asus-license-eperm-retry-2026-10-09-v1` and its
raw output goes to a new ignored directory. Run its Taskfile preflight first.
The retry is consumed even if launch or network access fails again; do not
switch videos or silently retry the extractor.
