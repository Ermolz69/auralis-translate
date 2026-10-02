# Kirin current original-platform Chinese SRT probe

Date: 2 October 2026. Experiment identity:
`DATA-03-youtube-geekerwan-kirin-original-caption-2026-10-02-v1`.
This follows the completed metadata-only
[Kirin source-version check](2026-10-02-youtube-geekerwan-kirin-license-result.md).
It changes neither the PLAN-03 release scope nor the source-admission decision.

## Question and fixed inputs

The current YouTube video `73XUeYRFsZU` reports 852 seconds, whereas the
archived Commons media measures 761,818 ms and its 304-cue Chinese SRT ends
at 758,784 ms. Determine whether the single advertised original-platform
`zh-CN` `srt` track has timing beyond the archived version. A newly acquired
track would remain an unassigned technical candidate; even matching runtime
cannot establish spoken alignment or caption rights.

Input metadata: the one retained extractor stdout in
`.cache/eval/youtube-geekerwan-kirin-license/attempt-w7pIGY/`, SHA-256
`26e81c23f653efc066b3d9a7ef83da4e76b36252e9508a0eb35a980de682f15b`.
It identifies video `73XUeYRFsZU`, original-platform license field
`Creative Commons Attribution license (reuse allowed)`, one `zh-CN` `srt`
track and a `https://www.youtube.com/api/timedtext` URL. The archived SRT
SHA-256 is
`57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb`.
Split: unassigned technical candidate, never sealed holdout. No translation
model, reference, prompt, TTS or human score is involved.

## Budget and stop conditions

Run Taskfile preflight with the exact metadata, track host/path, video ID,
language, format and archived SRT hash checked. Permit **one** HTTPS GET of
the retained track URL, no retry or redirect, 60-second deadline and
1-MiB response cap. Store raw success or non-200 body and structured status
privately under ignored `.cache/eval/youtube-geekerwan-kirin-original-caption/`.
Preserve failed attempts. Do not download video/audio, send cookies, print
the signed URL, publish caption text, or try a refreshed URL within this
experiment. A stale URL, HTTP failure, empty body or cap breach is a retained
failure and ends this attempt.

If the GET succeeds, hash the original response bytes and inspect them with
the same strict SRT CLI used for other source candidates. Report cue count,
first/last timestamps, overlaps and comparison with the archived SRT and
852,000 ms original-platform metadata. Do not rewrite either source or trim
late cues. Separate clock compatibility from actual Chinese speech alignment.
Only after a version-matched, rights-suitable subtitle/media pair is found
would a private beginning/middle/end audio packet and independent reviewer
be appropriate. Regardless of this probe's outcome, DATA-03 and G3/G4/A4
remain open until the corresponding rights and human evidence exists.

## Inspection infrastructure retry, recorded after the first attempt

The first local strict-CLI inspection on the acquired bytes failed before
process creation with `spawnSync ... EPERM`. Its stdout/stderr and report are
retained in the private `strict-inspection/` directory. This is not a parser
rejection or a second caption GET. Permit one elevated **offline** retry using
the same source and CLI binary SHA-256, stored separately in
`strict-inspection-retry/`. Stop after that attempt regardless of its result;
no further source acquisition or executable change is part of this probe.
