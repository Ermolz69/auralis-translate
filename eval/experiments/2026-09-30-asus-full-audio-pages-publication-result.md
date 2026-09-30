# Complete ASUS audio diagnostic on existing Pages

Date: 30 September 2026. Translate revision
`551d17cd0ed1a6b91c18698ac5b16df96614638b` published the redacted
268-cue real-SAPI and complete-media diagnostic in the existing Tailwind-CDN
report. The [Pages workflow](https://github.com/Ermolz69/auralis-translate/actions/runs/36775242705)
completed successfully for that revision. `task site:build`, `task site:check`,
`task docs:check`, and `task plan:check` passed before publication. Earlier
measurements and the failed v1/v2 media outcomes remain on the page.

`task site:live:check` received HTTP 200 from the
[published report](https://ermolz69.github.io/auralis-translate/?revision=551d17cd0ed1a6b91c18698ac5b16df96614638b#asus-full-audio).
Live and local HTML were byte-identical at 1,063,811 bytes, SHA-256
`429315727c5b5e4f692e3752f0f29c231c854ae2715b611d53d103aa4d2f4343`.
The ignored local live-check report is
`.cache/eval/live-pages-check/attempt-379ef68c-18a7-4b0f-9918-ce56bb1a63fe/report.json`,
SHA-256 `7748a782ae1d34a6587884459b33483b1b7ada1cfcc6a3ed925b3c16881617e6`.
The [redacted public summary](../reports/2026-09-30-asus-full-audio-summary.json)
is SHA-256 `0edc413cbbaac55dfdea43711d712a9dfb163290fb1bda2d8ccce49b8278ea1a`.

The live page was also inspected in the in-app browser. At a 539-pixel
viewport, the document width was 524 pixels. The ASUS section showed the
268 WAV result, 264 timing overruns, 259 overlapping starts, the missing-tail
v1 result, the long-timeline v2 result and the technically complete v3 media.
The first-screen release heading still read "Перевод и озвучка пока не
приняты". The section states that completing a playback process does not
constitute human listening or acceptance.

This publication does not accept translation, speech fit or audio quality.
Raw source, model replies, WAVs and media remain private. Human bilingual
review, listening, caption and media rights, source speech alignment, a
clean-Windows trial and G1–G9/A1–A6 remain open. The
[previous ASUS v6 publication](2026-09-30-asus-v6-pages-publication-result.md)
remains a separate dated, byte-pinned record.
