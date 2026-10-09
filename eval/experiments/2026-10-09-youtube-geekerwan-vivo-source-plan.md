# Vivo/MediaTek interview original-platform metadata screen

Date: 9 October 2026. Backlog: `DATA-03`. The candidate is the Geekerwan
[YouTube interview](https://www.youtube.com/watch?v=_G4e2p1p-is) with two
named guests, discovered from a contemporary public link and the retained
[Commons version](https://commons.wikimedia.org/wiki/File:%E9%87%87%E8%AE%BFvivo_%26_MediaTek%E7%A0%94%E5%8F%91%E5%A4%A7%E4%BD%AC%EF%BC%9A%E8%93%9D%E5%8E%82%E4%B8%8E%E5%A4%A9%E7%8E%91%E5%90%88%E4%BD%9C%E8%83%8C%E5%90%8E%E7%9A%84%E6%95%85%E4%BA%8B.webm).
The existing Commons Chinese SRT revision `979826861` has 467 strict cues,
SHA-256 `8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000`.
The private matching 240p WebM has SHA-256
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`
and measured duration 1,115,570 ms. These bytes remain unchanged and private.

Identity: `DATA-03-youtube-geekerwan-vivo-license-2026-10-09-v1`.
Use the pinned `yt-dlp` 2026.07.04 at SHA-256
`52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`.
Before any network call run `task eval:data:youtube:vivo:license:preflight`.
Permit one metadata-only extractor invocation for exact video ID
`_G4e2p1p-is`, zero retries and downloads, 90-second wall limit, 12-MiB
combined output. Retain raw stdout/stderr and the report only under ignored
`.cache/eval/`; stop after this attempt, including pre-spawn or network failure.

Inspect reported creator, license, duration, regular Chinese `subtitles`
versus `automatic_captions`, and any discrepancy from the retained Commons
media. A regular track is evidence of a separately supplied YouTube caption,
not proof of human transcription. Current YouTube metadata does not validate
the archived Commons SRT or its timing. Any caption acquisition, audio
alignment check and scene admission require separate pinned follow-up plans.
Keep media, subtitle and audio rights independent; a Commons CC label or
YouTube video license field alone does not decide all rights. This screen
makes no model/TTS call and cannot approve a development or holdout source.
