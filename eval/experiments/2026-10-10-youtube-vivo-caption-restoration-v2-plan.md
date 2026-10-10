# Vivo YouTube caption retention recovery v2: frozen plan

Date: 10 October 2026. Backlog: partial `DATA-03`. This is a new acquisition
identity after the [retention audit](2026-10-10-vivo-source-availability-recheck.md),
not a retry or replacement of the 9 October source experiment.

Identity: `DATA-03-youtube-vivo-caption-restoration-2026-10-10-v2`.
Source: creator upload `https://www.youtube.com/watch?v=_G4e2p1p-is`.
The complete 18:35.570 interview is the one development scene. The retained
Commons SRT (467 cues) is SHA-256
`8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000`;
the private media is SHA-256
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
The prior YouTube SRT was 33,577 bytes, SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
These are identities for comparison, not references to put in a request.

Use the existing local `yt-dlp` binary only if its SHA-256 is
`52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`.
Run `task eval:data:youtube:vivo:restore:preflight` before any network call.
Then allow **one** metadata-only extractor process: 90-second wall limit,
12-MiB combined output cap, no media download, no playlist, no retries.
Save stdout, stderr, process outcome and timestamps in a new ignored attempt
directory. Stop on process failure, unsupported identity, duration change
larger than 2 seconds, absent regular `zh-CN` SRT, or an automatic-only track.

Only after successful metadata validation, allow **one** HTTPS GET to its
exact `www.youtube.com/api/timedtext` `zh-CN` SRT URL, with a 60-second
timeout, 1-MiB response cap, zero redirects and retries. Save the exact
response bytes, HTTP status, content type, timing and error in a separate
ignored attempt directory. Consume the attempt even on HTTP or sandbox
failure. Never write into the old `attempt-LQWxgw` path or change Commons
files, translations, checkpoints or accepted results.

The read-only report must compare SHA-256, byte count, strict cue count,
every cue's text and ID, every time row, first/last cue and containment in
the pinned media. Compare both with the retained Commons SRT and the
published v1 source-version report. An identical old YouTube SHA proves
exact byte restoration; a different SHA requires a new version decision.
Keep source words out of the public report. The plan's data are exposed
development material; no holdout/reference text may enter requests.

Budget: two network operations at most (one metadata process, one caption
GET), no model/ASR/TTS calls, no retries. Outcomes are success, changed
version, or retained failure. This experiment cannot establish human
caption authorship, exact speech alignment, soundtrack rights or release
admission. A Chinese listener and a separate rights review remain required.
