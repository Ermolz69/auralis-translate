# REG-050: mapped but unreviewed source inflated eligible-cue count

Date: 2 October 2026. Scope: `DATA-01` counter correction and `EVAL-04`
regression maintenance. This changes the reporting definition before any real
source was admitted or sealed. It does not alter source bytes, accepted
translations, reviewer requirements, G3/G4/G5 thresholds or split assignments.

The minimal [authored two-cue inventory fixture](../corpora/source-inventory-example-v1.json)
has state `source_checked`, one explicitly excluded cue, approved subtitle
rights and `none` for alignment and reference reviews. The old
`validateSourceInventory` implementation counted its other cue as eligible
because it summed every parsed scene in any state after `inspected_candidate`.
With the new contract test in place, `task eval:data:check` failed 2/9 source
inventory tests: it observed `eligible_cues: 1` where the fixture and the new
minimal check required `0`. This is a deterministic counter defect, not a
model translation or human judgment.

The counter now includes only `reference_reviewed`, `development_only` and
`holdout_frozen` states. Those states already require human-reviewed alignment
and reference for every scene plus approved reference rights. All other states
contribute zero eligible cues. [REG-050](../regressions/source-eligibility-before-review-v1.json)
retains the reproducer, four related controls and two passing reviewed-state
controls. The fixture remains a two-cue source with one explicit exclusion;
its corrected denominator is zero. Previously published historical observations
stay available separately. The 12 real technical candidates still contain
3,336 inspected cues and zero eligible cues, so no real-source count changed.

After the fix, `task eval:data:check` passed 9/9 source-inventory, 4/4
cross-inventory and 4/4 timing coverage tests, plus all ten source manifest
checks. This proves the counter and fixtures only; there are still zero actual
bilingual reviewers and no accepted release corpus.

`task eval:regression:catalog:check` passed all versioned catalogs through
REG-050; `task docs:check` passed 360 local Markdown files and `task plan:check`
passed the 49-task dependency graph. `task site:build` regenerated the current
and historical pages, and `task site:check` passed their data, scripts and
public-file boundaries. These checks do not validate translation meaning or
audio quality.
