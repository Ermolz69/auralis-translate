# RELEASE-05 self-audit v16: matched source and complete technical speech

Date: 10 October 2026. This extends the [v15 audit](2026-10-09-release-05-audit-attempt-v15.md)
after the [original YouTube scene recheck](2026-10-10-youtube-vivo-source-recheck.md)
and [complete real-SAPI technical pilot](2026-10-10-vivo-real-sapi-technical-result.md).
The PLAN-03 Goal still requires a Chinese-to-Russian long-subtitle candidate,
reviewed meaning and a real Auralis dubbing pilot on the same admitted source.
Japanese, subtitle-free ASR and the owner-deferred desktop UI are separate.

| Gate | Current result |
| --- | --- |
| G1–G2 | Partial structural evidence: both prior v8 candidates retained 467/467 original cue IDs and timing, but no single final candidate was selected |
| G3–G5 | Open: known 36-month, team, clock and future-product errors; zero independent Chinese–Russian ratings or approved terminology/scene decisions |
| G6–G8 | Open: no accepted full quality/SLA/recovery matrix or approved end-to-end selected-result lineage |
| G9 | Open: no unseeded clean Windows installation for the selected endpoint; desktop remains deferred |
| A1 | Open: no reviewed translation, spoken adaptation, speaker map or approved voice selection |
| A2 | Partial engineering only: 467/467 real SAPI WAVs and one complete decoded media output; no approved segments |
| A3 | Failed for this draft: 465 cue-window overruns, 464 overlapping starts, only 50/467 mathematical fits at up to 1.5× |
| A4 | Open: one technical scene rather than three independently heard and scored 10–20-minute scenes |
| A5 | Open: no selected natural-media restart/cancellation and full soak matrix |
| A6 | Open: the full FFplay process completed, but no person listened or approved delivery and redistribution rights remain unresolved |

The YouTube item advertises a regular `zh-CN` SRT rather than a YouTube
automatic track. Its 18:36 video and 467-cue source copy are version-matched.
Three 12-second source-audio windows have plausible caption-topic agreement
by independent ASR, with known recognition errors and no human listener.
The metadata's CC Attribution label, Commons import-review notice and
creator's Bilibili no-repost notice require an item-level rights decision;
the Chinese text and separate soundtrack are not release-admitted. No new
source or holdout cue became eligible.

The local Auralis branch preserves all private 467 WAVs, one 52,394,280-byte
decoded video and one read-only fit calculation. The source video, original
Chinese subtitles, both full Russian drafts, v8 product profile and prior
failed experiments remain unchanged. No model or TTS was rerun after the
single full synthesis. One full FFplay process completed in 1,117,185 ms;
the independent Taskfile checker rehashed every source/WAV/media/playback
artifact and reproduced the fit and packet measurements. Auralis's technical
branch remains separate from a production
selected-result handoff; no public third-party media is exported.

**RELEASE-05 remains failed/open.** Next repair the recurring translation
fact errors on bounded same-source and related controls, obtain an
independent Chinese–Russian meaning judgment and a source-audio/speaker
review, resolve rights, then adapt and approve a spoken script against an
audible fit policy. A clean Windows install and the final A1–A6 audit remain
required. Rollback is a fresh v8 Translate run using a compatible backup
database, while keeping the previous databases, raw responses, WAVs and
rendered technical media for audit; do not downgrade SQLite in place.
