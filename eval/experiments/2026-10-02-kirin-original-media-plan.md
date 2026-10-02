# Kirin original-platform 240p media acquisition plan

Date: 2 October 2026. Experiment identity:
`DATA-03-youtube-geekerwan-kirin-original-media-2026-10-02-v1`.
The current original-platform Chinese track has 343 strictly inspected cues,
ending at 849,160 ms; 39 cues exceed the retained 761,818 ms Commons video.
The original-platform metadata declares 852,000 ms. The purpose here is to
retain small original-platform audio/video streams for a private version and
speech-alignment packet. No source, translation or audio gate is admitted by
download or matching clocks.

## Frozen inputs and budget

- Source video ID `73XUeYRFsZU`; original-platform metadata stdout SHA-256
  `26e81c23f653efc066b3d9a7ef83da4e76b36252e9508a0eb35a980de682f15b`.
  Its license field says `Creative Commons Attribution license (reuse allowed)`.
  This is an observed field, not a decision about caption authorship or rights.
- Private Chinese SRT SHA-256
  `c2a5fa3ae5139fe90b2be0b4b48b10ddd20d9b42103f4dd8401e1426d1b3eae5`.
  Split remains unassigned, never sealed holdout.
- Download exactly format `133` (240p H.264 MP4 video-only, declared
  4,126,636 bytes) and format `139` (AAC M4A audio-only, declared
  5,200,087 bytes) from their retained HTTPS `*.googlevideo.com/videoplayback`
  URLs. Check URL identity and format metadata before access; never print the
  signed URLs.
- At most two GETs, one per stream, in that order. Each has a 90-second
  deadline and 6-MiB response cap; total retained media cap 12 MiB. No
  redirects, cookies, retries, alternate formats, refreshed metadata URL or
  parallel model/TTS work. Stop after a failed stream. Preserve raw success or
  bounded error body and status in ignored private storage. Do not publish
  either media stream or source caption text.

If both streams arrive, rehash and probe each with the pinned FFprobe binary,
then mux an owned copy with the pinned FFmpeg binary without re-encoding.
Compare actual decoded duration to 852,000 ms and cue coverage; video and
caption clocks alone do not prove Chinese speech, scene/speaker mapping or
translation quality. Preserve every failed mux/probe. A human must still
listen to cue-linked start/middle/end windows, and subtitle/audio rights must
be confirmed before any cue is marked eligible or shared with volunteers.
