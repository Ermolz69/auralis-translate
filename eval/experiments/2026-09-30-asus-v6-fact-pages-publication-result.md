# Paired ASUS fact screen published on existing Pages

Date: 30 September 2026. Translate revision
`e967d8c18e22a949db3e97dcccd3a33c4768efc6` published the redacted
64-response 1.8B/7B screen and REG-034 status beside all earlier ASUS
results. The [Pages workflow](https://github.com/Ermolz69/auralis-translate/actions/runs/36723444465)
completed successfully for that exact revision. `task site:build` generated
1,058,139 bytes and `task site:check` verified earlier measurements and
the new evidence identity. `task eval:natural:asus:v6:fact-screen:check`
separately verified every private raw response and the retained zero-chat
launch failure. `task test:context-v6`, `task check`,
`task eval:regression:catalog:check`, `task docs:check` and
`task plan:check` passed on the candidate.

`task site:live:check` received HTTP 200 from the
[published report](https://ermolz69.github.io/auralis-translate/?revision=e967d8c18e22a949db3e97dcccd3a33c4768efc6#asus-v6-fact-screen).
Live and local HTML were byte-identical at 1,058,139 bytes, SHA-256
`f608662124ea3b87f1181460462fe6c643e8edc8a84bf0b63cab4034d01e6a64`.
The ignored private live-check report is
`.cache/eval/live-pages-check/attempt-53a67e4f-2017-42f5-abc3-aa3605c94bc1/report.json`,
SHA-256 `f817918066deefb15f01402b13e4f4fe41b0006c41973e830e891fbf4eef581c`.
The public redacted JSON SHA-256 is
`d1f1703e37d9ca878275707e54cee0714c7653bc7890b89f5df14fe3cd7af068`.

The live section was inspected in the browser at 1280 x 800 and 390 x 844
CSS pixels. Document widths were 1,265 and 375 pixels, respectively;
the 650-pixel comparison table scrolled inside a 297-pixel mobile container
without page-wide overflow. The section showed the exact 32/32 paired
counts per model, tokens, HTTP time and sampled memory, the two invalid
translated text fields, zero human reviews, no selected model and no
approved spoken script. The first-screen heading remained "Перевод и
озвучка пока не приняты". The viewport override was reset afterward.

The original Chinese subtitles, model prompts/replies and candidate SRT
were not published. The narrow text guard has fixture evidence but no
post-fix natural full-file run. Source rights/audio alignment, independent
bilingual and listener review, clean Windows installation and G1–G9/A1–A6
remain open. The [earlier v6 publication](2026-09-30-asus-v6-pages-publication-result.md)
remains a separate dated, byte-pinned record.
