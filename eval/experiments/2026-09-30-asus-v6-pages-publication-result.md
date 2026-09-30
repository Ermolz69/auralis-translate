# ASUS v6 diagnostic published on existing Pages

Date: 30 September 2026. Translate revision
`3a267fa6d17f354e7f5e1d7326bea7f29b43d138` published the redacted
268-cue ASUS v6 diagnostic and the read-only measurement warning result.
The [Pages workflow](https://github.com/Ermolz69/auralis-translate/actions/runs/36718085110)
completed successfully for that exact revision. `task site:build`,
`task site:check`, `task docs:check`, and `task plan:check` passed before
publication. The earlier measurements and failed v5/7B prefixes remained
in the single-file report.

`task site:live:check` received HTTP 200 from the
[published report](https://ermolz69.github.io/auralis-translate/?revision=3a267fa6d17f354e7f5e1d7326bea7f29b43d138#asus-v6-long).
Live and local HTML were byte-identical at 1,052,354 bytes, SHA-256
`e5c912e8926825dd1b97c9f6f068dfce92a6897b9a915caad3bfb309052fdecf`.
The ignored private live-check report is
`.cache/eval/live-pages-check/attempt-0286a2ff-a994-42cb-bd7d-7fab53617c26/report.json`,
SHA-256 `166c11a1ef86b43fa085971a6ef00b3a16196e132cec088b92e7fecff11282a8`.
The published redacted summary JSON SHA-256 is
`1ab55b39ede27569fcecf416185516fadcd5df59591a5d913b120aa743429959`.

The live page was inspected in the browser at 1280 x 800 and 390 x 844
CSS pixels. The document widths were 1,265 and 375 pixels, respectively,
without horizontal overflow. The ASUS section showed 268/268 structural
completion, 44-cue AI triage, measurement warning cue IDs 12 and 227,
zero independent human review, `needs_review`, and no approved spoken
script. The first-screen heading remained "Перевод и озвучка пока не приняты".
The viewport override was reset afterward.

This publication does not accept translation quality or audio quality.
The raw Chinese source, model responses, candidate SRT and matched media
remain private. Rights, speech/subtitle alignment, independent bilingual
review, listener assessment, clean-Windows trial and G1–G9/A1–A6 remain open.
The [prior schema-screen publication](2026-09-30-natural-asus-slot-schema-pages-publication-result.md)
remains a separate dated, byte-pinned record.
