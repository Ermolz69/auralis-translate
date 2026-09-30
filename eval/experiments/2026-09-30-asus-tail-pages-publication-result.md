# ASUS long-file failure report: published Pages verification

Date: 30 September 2026. Translate commit
`79c1828560de3e0049c72aab7ce357115c985717` was pushed to `origin/main`.
The [Pages workflow](https://github.com/Ermolz69/auralis-translate/actions/runs/36702475250)
completed successfully for that exact head. `task site:build` generated the
1,041,049-byte single-file Tailwind-CDN report. `task site:check` passed and
retained the earlier measurements. `task site:live:check` then received HTTP 200
with `text/html; charset=utf-8` from the
[existing public report](https://ermolz69.github.io/auralis-translate/?revision=79c1828560de3e0049c72aab7ce357115c985717).
The live and local HTML were byte-identical: 1,041,049 bytes, SHA-256
`830d72b47eef47f80bbfc221eb23643c2c4ff462900f7e63e47771b6c7631beb`.
The ignored private check report is
`.cache/eval/live-pages-check/attempt-b60ec0c8-4d57-4255-88b0-befdcfbdec4d/report.json`,
SHA-256 `c9085179e144ca58fddaaaf731e8a7a57ca96c78b8ade7be115b4fc2d73c709d`.

The live `#asus-tail` section was inspected in the browser at 1280 x 800 and
390 x 844 CSS pixels. At both widths the failure, copied-state recovery and
temperature result were visible. At 390 px the document scroll width was 375
px and the wider table stayed inside its horizontal-scroll wrapper. The
section states that the original 7B run saved 226/268 cues but produced no
final SRT, the copied-state continuation failed on cue 227 again, and a
temperature-zero screen passed strict SRT on 6/8 calls without repairing the
ASUS defect or the Vivo fact error. Its public links point to redacted JSON;
private source, model requests, responses and media remain outside Pages.

Publication verifies deployment of an incomplete diagnostic. It does not
establish Chinese source rights or audio alignment, translation adequacy,
independent bilingual review, listening, or any G1–G9/A1–A6 gate.
