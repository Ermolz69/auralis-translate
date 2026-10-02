# Public report layout v2

Decision: 2 October 2026. The owner requested a current-state landing page and
a separate history page. This replaces the single-HTML presentation boundary
in the agent workflow; it does not change any translation/audio gate or the
underlying experiment evidence.

`site/index.html` is the first page. It reports the latest frozen candidate
measurements, the current G1–G9/A1–A6 decision, how the implemented path
works, missing inputs and the ordered next work. It must distinguish a
structurally complete draft from a reviewed translation, technical TTS from
human listening, and a CLI run from clean installation. The page must not
repeat the historical 20-example tables or failed-run chronology.

`site/history.html` contains the complete former report, including all 180
historical v1/v4 requests, 240 paired model requests, later natural-source
results, failures, provenance and download controls. Its embedded JSON and
source/result assertions remain versioned and executable. A reciprocal link
connects the current page and history. No private subtitle, audio, video,
reviewer sheet, model weights or SQLite database is published.

`task site:build` deterministically writes both files from committed source
and reports. `task site:check` validates both, exact `site/` contents, data
identities, current figures, historical measurements, scripts and privacy.
`task site:live:check` compares both deployed HTML files byte for byte with
the committed files after the Pages workflow succeeds. A failed or missing
history page is a failed publication, even if the landing page loads. The
Tailwind browser CDN remains the only external page runtime dependency.
