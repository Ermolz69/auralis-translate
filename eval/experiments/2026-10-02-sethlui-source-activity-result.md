# Restaurant source audio: near-continuous sound cannot verify speech alignment

Date: 2 October 2026. Partial `DATA-03`/`VOICE-07` evidence from local Auralis
`feat/real-tts-pilot` commits `1758a47` (frozen plan, Taskfile and test) and
`9e25b64` (raw-log recomputation and retained result). The private 263-cue
Chinese SRT SHA-256 is
`4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964`;
the matched source WebM SHA-256 is
`6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6`.
Neither original changed. The Auralis branch remains local and unpublished.

`task voice:natural:sethlui:source:activity:screen` first passed three
boundary controls and media-tool verification, then made one read-only FFprobe
and FFmpeg pass at -35 dB / 300 ms. The 2,179-ms script run retained raw
private observations, report SHA-256
`1ea748f6d4a3e19626155edbb01fe1b421b98d0f2a47c94e6f639bd6ce361ee7`
and FFmpeg log SHA-256
`319bb3d841216aa01c7424e0f20f4434e72ddf3504c45469eeaba372ae93b1e7`.
There was no model, TTS or network request. Auralis
`task voice:natural:sethlui:source:activity:check` rehashed the exact inputs
and recomputed every cue overlap from the raw log, with
`source_speech_alignment_verified: false`. The
[source-free aggregate](../reports/2026-10-02-sethlui-source-activity-summary.json)
retains the checked counts; source text and media stay private.

The source has five detected silence intervals. Only two subtitle windows
intersect them, for 155/598,432 ms of total cue-window duration. Zero of 263
cues fall below 10% nonsilent activity. Time thirds cover 86/103/74 cues and
each has zero such flags. This is **uninformative for Chinese speech alignment**:
music or ambient sound can mask silence, so zero flags do not mean 263 cues
match spoken words. The result is retained as a failed triage method and adds
zero eligible cues. A speech-sensitive control and human beginning/middle/end
listening remain necessary; source component rights are still unverified.

The separate audio-input attempt in this agent interface returned "audio
content omitted because you do not support audio input" for the retained
private OGG. That is a tool limitation, not listening evidence. No independent
human reviewer or listener participated, and G3–G5/A1–A6 remain open.
