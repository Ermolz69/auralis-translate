# Current-state and history report split

Date: 2 October 2026. The owner requested that the existing GitHub Pages
landing page explain only the latest implemented state and workflow, with the
previous detailed measurements retained in a separate HTML file. The
[layout decision](../../docs/reference/public-report-layout-v2.md) changes
presentation only; it does not accept translation, audio, source rights or
release gates.

`site/index.html` is generated from frozen current source, model, term, audio
and backlog summaries. It reports 263/263 structurally preserved cues in both
latest restaurant drafts, zero independently reviewed cues, zero eligible cues
among 2,993 inspected source cues, and 263 real SAPI WAV with 256 overruns and
236 overlap starts. It explains the implemented SRT-to-checkpoint path and
orders the next work. Those counts are measured or explicitly missing; they
are not language or listening scores. The G9 note states its final clean
Windows installation role without making it a prerequisite for experiments.

`site/history.html` preserves the former single-page report, including the
earlier 20 authored examples, raw request measurements, later natural-source
results and failed attempts. Navigation links the two pages in both
directions. The public `site/` directory contains only these HTML files; no
private subtitle, WAV, media, model weight or database is included.

Verification: `task site:build`, `task site:check`, `task docs:check` and
`task plan:check` passed locally. Browser inspection on loopback confirmed
both pages render and reciprocal navigation works. The Pages workflow checks
the generated content before deploy; `task site:live:check` verifies both
published files byte for byte against the committed versions. Deployment and
live byte results are recorded in the final task report after publication.

This is partial `EVAL-03` presentation evidence. `RELEASE-05` remains failed:
source admission, independent bilingual review, listening and clean-machine
delivery are still missing.
