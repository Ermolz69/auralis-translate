# Two real voices in synthetic media

Status: technical `VOICE-02` evidence, 29 September 2026. Auralis isolated
branch `feat/real-tts-pilot` commit `3b6b5cc` froze the fixture and Taskfile
commands before rendering; `c788ddc` retained the report, source/spoken SRTs
and playback record. The private WAVs and MP4 remain in that worktree under
`.cache/voice/`. The [public summary](../reports/2026-09-29-sapi-multivoice-media-summary.json)
contains no private filesystem paths or voice bytes. Its raw Auralis report
and playback SHA-256 values bind the measurements to those local records.

The two existing real SAPI WAVs use `Microsoft Irina Desktop` and `Microsoft
Pavel`, both saying the same authored Russian line. The original cue windows
remain failed by 1,164 and 1,269 ms. The synthetic fixture alone placed them
in 0–4,000 and 4,500–8,200 ms of a 10-second solid-color video. No source
timing, selected translation or approved script was changed.

`task voice:media:multivoice:fixture:probe` initially failed before rendering:
the restricted environment returned `EPERM` when launching pinned FFmpeg.
The permitted retry passed `task media:verify`, syntax and input-hash checks,
rendering and full video/audio decode. The 96,209-byte H.264/AAC MP4 has
SHA-256 `fbf70171c36279ef87265d3de6422521408e3f963cd549567e21ea5f56e495f9`.
The two measured speech windows had decoded PCM RMS 902.1 and 1,613.7, the
declared gap RMS 0, and zero clipped samples. `task
voice:media:multivoice:fixture:play` used local FFplay 8.1.2 and its video/audio
player process reached the end on the exact output hash. The Auralis raw
report SHA-256 is `d8e41a037fe509377a6e76bb59a5d98468af38b75c726e962db65cda036e89a0`;
its playback record SHA-256 is
`8c781475f30301d98bf2924b7fe3d12b65d4cfcced468134fe85066a22dec4b`.

FFplay process completion is not a recorded human listening judgment. No
natural licensed video, reviewed Chinese/Russian scene, approved spoken
script, fit in original cue windows, production mixer or clean-install runtime
has been verified. A1–A6 and `VOICE-01`–`VOICE-07` stay open. Redistribution
rights for synthesized voice bytes are unconfirmed, so the MP4 and WAVs are
not on GitHub Pages.
