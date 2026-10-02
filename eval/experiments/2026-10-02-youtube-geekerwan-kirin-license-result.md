# Kirin original-platform metadata and source-version discrepancy

Date: 2 October 2026. Experiment:
`DATA-03-youtube-geekerwan-kirin-license-2026-10-02-v1`. This is the
single metadata-only probe frozen in the
[translation depth plan](2026-10-02-translation-depth-plan-v1.md). The source
remains an unassigned technical candidate; this probe does not admit cues or
establish translation or dubbing quality.

## Exact inputs and retained result

- Original video ID: `73XUeYRFsZU`, linked from the
  [Wikimedia Commons Kirin page](https://commons.wikimedia.org/wiki/File:Huawei_Kirin_9010_in-depth_analysis_compared_to_9000s_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_19.webm).
  Original-platform metadata reports the Geekerwan channel ID
  `UCeUJO1H3TEXu2syfAAPjYKQ`, upload date `20240428` and 852-second
  duration. The Commons file page still says license review is needed.
- Existing strict 304-cue Chinese SRT: Commons revision `880535591`, SHA-256
  `57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb`.
  Its first cue starts at `00:00:00,287` and final cue ends at
  `00:12:38,784`; the original bytes remain private and unchanged.
- Existing matched local Commons 240p video SHA-256
  `2911c8a14b6da9fa62d46235aa09a1b240ee1409ec8e28336edc7ed90c9af586`.
  The pinned FFprobe check measured `761,818 ms` and decoded three source
  audio windows without human listening. Private FFprobe report SHA-256:
  `af3e6699478be47d03412722e0501687a9046618018c1c99bc1eebc24f440211`.
- `yt-dlp` 2026.07.04 executable SHA-256
  `52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`.
  `task eval:data:youtube:kirin:license:preflight` passed source/media/tool
  identity checks and four bounded-process controls before network access.
- `task eval:data:youtube:kirin:license:inventory` ran once: one extractor
  invocation, zero retries, zero downloads, 90-second wall and 12-MiB output
  caps. It exited 0 in 4.785 seconds, without timeout or truncation. Raw
  stdout was 103,155 bytes, SHA-256
  `26e81c23f653efc066b3d9a7ef83da4e76b36252e9508a0eb35a980de682f15b`;
  stderr was empty. The ignored private attempt is
  `.cache/eval/youtube-geekerwan-kirin-license/attempt-w7pIGY/`, with raw
  stdout/stderr and inventory JSON. The inventory JSON SHA-256 is
  `b669bc11bdcebd61e79000938b2ea76cd1d6ca7d90ba0db512029423d19c5546`.

## Observation and decision

The extractor reports the original video license field as `Creative Commons
Attribution license (reuse allowed)` and advertises `en` and `zh-CN` subtitle
tracks, including a Chinese `srt` format. This establishes that a track was
advertised in this metadata response. It does not verify who authored the
captions, their license, their bytes or timing, or whether speech matches them.
No caption or media was downloaded from YouTube.

The current original-platform duration is `852,000 ms`, while the retained
Commons video is `761,818 ms`: a **90,182 ms discrepancy**. The existing SRT
ends near the Commons video's end. The cause of the duration difference is
unknown; no offset or scene correspondence may be inferred. In particular,
the current original-platform track cannot be used as a reference for the
local media without a separate version and human alignment check. The
[redacted public summary](../reports/youtube-geekerwan-kirin-license-v1.json)
records `duration_discrepancy`, `alignment_verified: false` and
`source_admission: unassigned_unreviewed`.

The offline checker pins the inventory and FFprobe records, rehashes the raw
extractor bytes, verifies the advertised language/format fields and checks
duration handling. Four related controls cover equal durations, rounding,
this 90,182 ms discrepancy and missing/invalid measurements. Even exact
duration agreement remains `duration_compatible_unverified`, never an
alignment claim. The 2,000 ms screening tolerance only separates conspicuous
duration discrepancies from potentially compatible runtimes; it is not an
admission threshold. `task eval:data:youtube:kirin:license:check` is the repeatable
offline check; the one-attempt inventory must not be rerun.

DATA-03 still has **zero eligible cues**. Rights for each audio/video and
subtitle component, Chinese speech alignment, scene boundaries and a human
review remain open. The next source step is to seek a version-matched,
rights-suitable source and have a person check a private beginning/middle/end
packet; the original 14:12 version and Commons 12:42 derivative must stay
separate until that evidence exists. No independent bilingual reviewer or
listener is available, so G3/G4 and A4/A6 remain open.
