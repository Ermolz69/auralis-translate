# Kirin constrained media redirect follow-up

Date: 2 October 2026. Experiment identity:
`DATA-03-youtube-geekerwan-kirin-original-media-redirect-2026-10-02-v1`.
The initial [zero-redirect plan](2026-10-02-kirin-original-media-plan.md)
stopped after one format-133 GET returned HTTP 302 with zero body; format 139
was not requested. The failure report is retained privately with SHA-256
`c937756018622b6ce6b744f2810d7112059467edb4723528073a3b0ee94ceb8a`.
No media was acquired in that attempt. This is a new bounded hypothesis that
the original stream URL needs one CDN relocation, not an unlimited retry.

Use the same pinned video ID, metadata hash, 240p format `133`, audio format
`139`, caption hash and declared sizes as the prior plan. Permit one fresh
attempt: at most two streams, and at most **one** HTTP redirect per stream,
so at most four GETs overall. A redirect target must be HTTPS on
`*.googlevideo.com` with `/videoplayback` and the same `itag`; do not follow
any other host, path, missing target or second redirect. Use a 90-second
deadline per stream including redirect, a 6-MiB response cap per stream,
and a 12-MiB total retained media cap. No alternate format, refreshed
metadata, cookies, retries after a failed stream or parallel model/TTS work.
Save every bounded error body, status, safe redirect host/path and URL hash
privately without printing a signed URL.

After this attempt, stop network work for this source regardless of outcome.
If both streams arrive, probe and mux only owned private copies, compare
clock/cue coverage and prepare a human source-audio packet. Success would
still not prove caption rights, spoken alignment, translation or dubbing
quality; the source remains unassigned and unreviewed.
