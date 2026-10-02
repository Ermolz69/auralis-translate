# Corrected source report deployment verification

Observed 2 October 2026, 13:58–13:59 UTC. The tested and pushed Translate
commit was `6c037f4c6175dc25cc151377e2a795a2c36ae1d5`; `origin/main`
resolved to the same SHA. Its two scoped commits were `a079971` (identity
guard, manifests and evidence) and `6c037f4` (current/historical report).
Both used the computer's verified primary global Git author and committer.
The unrelated edit to `docs/architecture/014-result-history-selection.md`
remained unstaged and uncommitted.

The [Publish translation report workflow](https://github.com/Ermolz69/auralis-translate/actions/runs/37016297760)
finished successfully for that exact SHA, including the report verification
and Pages deployment. Direct GETs with the SHA as a `revision` query returned
HTTP 200 for both [current](https://ermolz69.github.io/auralis-translate/index.html?revision=6c037f4c6175dc25cc151377e2a795a2c36ae1d5)
and [historical](https://ermolz69.github.io/auralis-translate/history.html?revision=6c037f4c6175dc25cc151377e2a795a2c36ae1d5)
HTML. Their downloaded UTF-8 SHA-256 values matched the local generated files
byte for byte:

| Page | Local and live SHA-256 |
| --- | --- |
| `site/index.html` | `8d9d23336f4da600a154ab58cc5a3eb77cb4c3fc836057e5eb555c33cfa7f05e` |
| `site/history.html` | `f188ea016f4fea2687ca41e71c9053520c77e059eeebe4be37df7d4ae0f73cce` |

The local preview was inspected at 384 px and 1280 px widths; the 11-track,
10-media-group, 3,243-cue correction was readable, with no observed visible
horizontal overflow. `task site:check` verified reciprocal links and the
dated historical 12/3,336 snapshot. The deployment checks confirm report
identity and availability, not source rights, Chinese speech, translation
quality, listening or release acceptance.
