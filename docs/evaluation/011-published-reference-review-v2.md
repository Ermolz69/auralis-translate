# Published-reference Chinese translation evaluation v2

Status: prospective protocol for the owner's translator-only scope, 10 October
2026. This supersedes the *future execution route* in [human review v1](009-blind-source-review.md),
not its historical results. No holdout has yet been admitted or scored under v2.

## Evidence boundary

The owner has ruled out recruiting a Chinese–Russian reviewer or volunteers. Use
independently published professional/official Chinese and Russian versions of
the **same underlying work**, preferably subtitle tracks for the same video
revision. Record publisher, translator or editorial credit when stated, dates,
rights, exact media/subtitle revisions and SHA-256 hashes. A published Russian
translation is reference material, not an independent judgment of our output.
AI analysis of our output must be labelled AI; automated checks are not human
ratings. Do not ask the owner for a reviewer to read the whole file.

## Admission and split

Before model inference, freeze source groups, eligibility, rubric, exclusions,
reference provenance and hashes. Admit at least 300 distinct eligible Chinese
subtitle cues to a sealed release holdout from sources absent from training,
prompt tuning, regression development and earlier public screens. Split whole
videos/series or works; near duplicates and alternate releases stay together.
Verify that speech, Chinese captions and published Russian text belong to the
same media revision. Align scenes and propositions, not merely cue numbers;
record unmatched or ambiguous spans as ineligible **before** seeing model output.
Unknown rights bar public reproduction, not private metadata-only screening.

The translation model receives Chinese source and permitted Chinese context
only. It never receives Russian references or expected facts. Seal the Russian
side until raw and accepted model responses have been durably saved. A holdout
group inspected for tuning is retired to development and replaced for release.
Keep failed attempts, exclusions, reference variants and source originals.

## Source-grounded assessment

Assess every eligible cue with its scene, source, published Russian rendering,
candidate output and pre-frozen terminology ledger. Record named entities,
actor/action, negation, time/modality, quantities, omissions, additions and
scene coherence as separate fields. A different natural wording is acceptable
when the source meaning remains intact. Use deterministic checks where possible
and a separately identified source-aware AI assessment for residual meaning;
retain its full inputs, outputs, model/version, rubric and disagreement flags.
If two assessment passes or the source/reference disagree, count the cue as
**uncertain**, not as a success, until resolved from primary source evidence.
Do not manufacture a definitive answer from a single Russian phrasing.

G3 keeps the 95% target: at least 95% of all frozen eligible cues must receive
source/reference-supported adequacy at least 4/5, with every cue assessed or
counted as a failure. Report the machine/AI basis of each score and its coverage;
do not call this a human accuracy rate. G4 requires zero unresolved *detected*
critical source-fact errors across the whole holdout, plus passing predeclared
adversarial controls. This cannot prove that no undetected error exists. G5 keeps
the 98% target over all applicable occurrences of **pre-frozen, source-grounded**
terms. Record provenance and allowed inflections; a zero denominator is not a
pass. Names, money and negation are reported separately even when no glossary
entry applies. Uncertain term applicability counts against acceptance.

The natural long-file audit covers all predeclared risk and seam cues and at
least 200 stratified cues per file, or every cue for shorter files, with
beginning/middle/end coverage. A sampled audit never certifies every line.
Report full cue denominator, assessed fraction, confidence limits, all
disagreements and each error severity. Complete G3–G5 only after the same
committed candidate, source groups and rubric satisfy these gates. A release
decision must say **reference-based/AI-assisted**, never independently
human-reviewed, and retain the residual risk of unobserved semantic defects.

The exposed Shanghai written-policy comparison and authored REG-085 controls
are development diagnostics. They are not subtitle holdout groups and cannot
set or pass the prospective thresholds above.
