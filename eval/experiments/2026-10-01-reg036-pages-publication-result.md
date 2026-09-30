# REG-036 Pages publication check

Date: 1 October 2026. This records publication of the redacted 268-cue
[whole-file measurement audit](2026-10-01-asus-whole-file-measurement-v3-result.md),
not a translation or audio acceptance decision. The repository/report
revision was `95d2d354e91571d0f42c1c5db527cf34c15ff974` on `main`.

The [GitHub Pages workflow](https://github.com/Ermolz69/auralis-translate/actions/runs/36780551945)
completed successfully for that exact revision. `task site:live:check`
requested the [published report](https://ermolz69.github.io/auralis-translate/?revision=95d2d354e91571d0f42c1c5db527cf34c15ff974#measurement-v3)
once and returned `live_byte_identical`: HTTP 200, `text/html; charset=utf-8`,
1,068,767 bytes locally and remotely, and SHA-256
`32761bc20cfbe1a96b191a845d4dd85abd72671a82c627888e72726496cf19a0`
on both copies. The ignored machine-readable check report is
`.cache/eval/live-pages-check/attempt-dcb0a531-4470-49a0-9f45-e0fdae49e75e/report.json`,
SHA-256 `d18a32b28c527d4fc86c6e5fa6f915482e59e6173d43ce9d1c44dbd1b9ddc41e`.
It records the UTC GET window `2026-09-30T21:37:21.613Z` to
`2026-09-30T21:37:22.044Z`, not the time of the earlier private audit.

The page was opened in the in-app browser at the same revision and
`#measurement-v3` fragment. The REG-036 heading, six-before/four-after
warning counts, remaining cue IDs, scope limits, pack hash and two evidence
links rendered. The previous REG-035 section remained present. The first
release heading still stated that translation and voice were unaccepted.
At a 1,280-pixel viewport the document width was 1,265 pixels, with no
horizontal overflow. This visual/DOM inspection is for one viewport and
does not establish cross-browser or mobile behavior.

The REG-036 pack is SHA-256
`69262f857d8901528faa09094cbcff9663eaceeff07c2842270a8cee220dae0e`.
The archived private subtitle candidate and prior benchmark/audio
measurements were not replaced. Human bilingual review, listening, source
rights, a clean Windows target and the deferred desktop decision remain open.
