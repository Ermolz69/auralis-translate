# Current release status leads the published report

Date: 30 September 2026. Translate `20ee2f5e26df4136eea38e9ca8e44f917ba6aee6`
moved the incomplete release status ahead of the preserved historical 20-cue
1.8B/7B comparison. The [Pages workflow](https://github.com/Ermolz69/auralis-translate/actions/runs/36704286189)
completed successfully for this exact head. `task site:build` generated
1,041,266 bytes; `task site:check` verified the new section order and retained
previous measurements. `task docs:check` verified 263 Markdown file links and
`task plan:check` verified all 49 backlog IDs before publication.

`task site:live:check` received HTTP 200 from the
[existing Pages report](https://ermolz69.github.io/auralis-translate/?revision=20ee2f5e26df4136eea38e9ca8e44f917ba6aee6).
The live and local HTML were byte-identical at 1,041,266 bytes, SHA-256
`8968ab0c5eea5964feb2e5a8138f5930ccfe766211c0866e6c1f18447deb108f`.
The ignored private check report is
`.cache/eval/live-pages-check/attempt-04504d5e-a3b6-4b7e-acc4-93ac801dde11/report.json`,
SHA-256 `b93276b6459418bf98373770387909d2776fd36c4f2034c9e14feef52e12cccf`.
The live first screen was inspected in the browser at 1280 x 800 and
390 x 844 CSS pixels. At both widths the first main section was
`release-readiness` with the visible heading "Перевод и озвучка пока не
приняты". The document widths were 1,265 and 375 px respectively, within
their viewports.

This corrects the risk that an old small-example model preference could be
mistaken for a current release choice. No model, script or gate was promoted.
The [previous ASUS publication](2026-09-30-asus-tail-pages-publication-result.md)
remains as a dated, byte-pinned record of the earlier page.
