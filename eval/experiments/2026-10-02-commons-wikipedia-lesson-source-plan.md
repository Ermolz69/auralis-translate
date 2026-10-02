# Commons Chinese Wikipedia lesson source screen

Date: 2 October 2026. Task: `DATA-03`. This is a source discovery screen, not an
eligible-corpus admission or language-quality experiment.

Question: does the self-published [second Chinese Wikipedia lesson](https://commons.wikimedia.org/wiki/File:%E4%B8%AD%E6%96%87%E7%B6%AD%E5%9F%BA%E7%99%BE%E7%A7%91%E6%95%99%E5%AD%B8%E9%A0%BB%E9%81%93%E7%AC%AC%E5%85%A9%E7%AB%A0.ogv)
have an actual original Chinese timed-text track that can be retained and parsed?
The Commons file page identifies the video as the uploader's own work under
CC BY 3.0 and lists `zh-cn` and `zh-hant` captions. That is evidence about the
video and track listing, not about subtitle authorship or speech alignment.
The source group is the five-part Chinese Wikipedia lesson series; it is
`unassigned` and cannot be split across development and holdout.

Frozen request: query Commons MediaWiki API for the current revision ID, author
and timestamp of `TimedText:中文維基百科教學頻道第兩章.ogv.zh-cn.srt`, then request
that exact revision's raw bytes. At most two HTTPS GETs, one attempt each,
90 seconds and 256 KiB per response, no redirects or retry. Preserve both raw
responses, status, SHA-256 and errors under ignored `.cache/eval/`. No video
download or model request. Stop on missing page, non-200, invalid UTF-8 or
oversized response. The preflight discloses the URL and limits.

The comparison is the previous failed two-source VOA screen, which had no
Chinese subtitle track. This source can advance only to `inspected_candidate`
after exact-byte SRT admission and caption provenance checks. Source language,
caption-to-speech alignment, rights for caption/audio, scene boundaries and
independent reference/review remain separate gates. No human or AI score is
claimed by this acquisition.

After the caption is strictly parsed, fetch the matching Commons original OGV
once from the file page's original-file URL. The page lists 17.54 MB and 3:59;
cap the GET at 24 MiB and 180 seconds with no retry or redirect. Retain original
bytes privately. Run one pinned `ffprobe` process (30-second limit, 1 MiB output)
to measure streams/duration, and compare all 37 cue end times to that duration.
This establishes media identity and timing containment only. A screen capture,
voice language and actual semantic alignment still require separate inspection.

The retained 37-cue track has 1- and 2-digit millisecond fields, which strict
plain-SRT rejects. Before derivation, freeze the source SHA-256
`a94f5aeaf53e1420d7ecfcfeecf18c436b4eb042d215c7a1f445e9e06852078d`
and revision `100755166`. Make one deterministic local derivative: interpret
each numeric millisecond field as an integer from 0 to 999 and left-pad it to
three digits. Preserve cue IDs, all text bytes, line endings and cue order.
Record each timing before/after and source/derivative hashes. Stop if any other
syntax differs or the strict CLI still rejects. This local normalization makes
no claim about audio timing and never replaces the original source bytes.
