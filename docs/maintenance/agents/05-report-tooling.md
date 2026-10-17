# Translate report tooling assignment

Execute proposed ID `MNT-05` on `refactor/translate-report-tooling` after required
MNT-02 commands exist. Read the [agent contract](../AGENT_CONTRACT.md).
Own `eval/scripts/current-report-data.mjs`, `check-public-demo-site.mjs`, private
projection/verification modules extracted from them and focused report tests.
Coordinate generated site files with MNT-01. Do not change frozen evidence,
historical probe inputs, model manifests or release decisions.

## Sequence

1. Build both report pages from unchanged evidence and retain a local baseline.
   Trace each current report field and checker block to its report/source owner.
2. Extract cohesive sections with explicit input/output contracts rather than
   a common mutable object or generic registry. Keep report data construction
   separate from verification. Preserve failure assertions and privacy exclusions.
3. Compare serialized data and generated HTML against the base on identical
   inputs. Allow only explicitly identified incidental differences, such as a
   documented build timestamp if one actually exists. Do not normalize away
   missing rows, changed labels, ordering, hashes or failing comparisons.
4. Add focused checks for representative absent/invalid evidence and unsafe
   source/model strings. Reuse existing loaders and the current/history split.
   Never use `site:capture` or rerun a model experiment to repair a build.

## Acceptance

Both pages retain their data, order, links, escaping, current/history distinction,
raw downloads, warnings and previous failures. The verifier rejects the same bad
data and privacy leaks. Missing evidence cannot become a default success.
Neither assembly nor verification starts a model, acquires media or writes an
old report. The large files are separated by real report responsibilities.

Run the MNT-02 focused report command, `task site:build`, `task site:check`,
`task docs:check` and `task plan:check`. Compare full generated artifacts and
inspect both pages at desktop/mobile widths through the existing local preview
when available. If browser inspection is unavailable, report that acceptance item
explicitly. No remote publication is part of this assignment.

Use small extraction commits, with generated-output changes explained separately.
Submit the common report with field coverage and artifact comparison results.
