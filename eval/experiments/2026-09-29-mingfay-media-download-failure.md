# Mingfay video acquisition stopped at HTTP 403

Date: 29 September 2026. `DATA-03` / prospective `VOICE-01`; result:
**failed before media bytes**. The [frozen one-attempt plan](2026-09-29-youtube-mingfay-media-plan.md)
selected video `0hoTgJKET7Q`, combined MP4 format `18`, 57,194,836
advertised bytes and zero retries. `task
eval:data:youtube:mingfay:media:preflight` passed exact metadata and pinned
`yt-dlp` SHA-256 checks. `task eval:data:youtube:mingfay:media:acquire`
invoked `yt-dlp` once; it identified format `18` but the media transfer
returned `HTTP Error 403: Forbidden`. Exit code was 1 after about 2.914
seconds. No complete or partial video file was retained, and no alternate
format or video was tried.

The private failure is in `.cache/eval/youtube-mingfay/media-vrjWGT/`:
`acquisition.json` SHA-256
`08C4B0320BCD5F4B7844FC79AF5AAB24ABA065502622B3A22E142FC0F0D36631`,
stdout SHA-256
`CF0689FC28162FC6FAEB5DBE11045AAAA9CF9FC5040A5CAA7D49FDF97E1023B9`,
stderr SHA-256
`73B64F2D7907E10044047ED221DD133CF3BC28BFC36D30BD0D09708B0F786B35`.
The public report contains no signed media URL, bytes or caption text.

The independently acquired Chinese subtitles remain a private text candidate.
This failure leaves source speech/subtitle alignment, real TTS on this media,
consumer playback and A1–A6 open. A different retrieval method or source
requires a new bounded plan and retained outcome; the one-attempt result is
not relabeled as successful.
