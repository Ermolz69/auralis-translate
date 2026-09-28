# Blind source-aware Chinese review v1

Status: `EVAL-01` protocol, 28 September 2026. This freezes scoring before the
v5 comparisons and sealed release holdout. No independent reviewer or human
score is present in this record. The existing model-size commentary was AI
editorial review with visible identities and cannot be recast as a blind score.

## Eligible material and blinding

Admit a source only through [inventory v1](../reference/source-inventory-v1.md):
approved subtitle/reference use, raw revision/hash, strict parser acceptance,
scene/cue mapping, explicit exclusions and source-aware Russian reference. A
release holdout requires distinct whole-source groups, human alignment and a
sealed manifest prepared before candidate inspection. At least 300 eligible
Chinese cues are reviewed for G3/G4/G5; every eligible holdout cue is scored.
Natural long-file audits review all predeclared risk and seam cues plus a
stratified sample of at least 200 cues per file, or every cue in a shorter file.
They state sampled and whole-file coverage separately.

The coordinator freezes corpus/reference/rubric hashes and a random
ordering seed before giving candidates to reviewers. The review packet contains
source cue, same-scene neighbors, permitted media context, approved terms,
proposed source-grounded reference and acceptable alternatives. It carries an
opaque candidate label, never model/profile/quantization or run order. Candidate
mapping stays sealed from the reviewer until all primary judgments are recorded.
References and expected facts are never sent to the translation model. A reviewer
may note that the source itself is ambiguous or mistranscribed; such an item is
adjudicated before eligibility is fixed, not silently excluded after seeing one
candidate.

Reviewers must understand written Chinese and Russian. At least one independent
human reviewer scores each eligible cue. A second independent bilingual reviewer
adjudicates critical or disputed meaning, reference and term calls. The model
operator/AI may triage but cannot count as either human. Keep private identities
in controlled records and use stable pseudonymous reviewer IDs in public evidence.
No review request is sent to another person without the owner's authorization.

## Cue score and error taxonomy

Score **adequacy against source meaning** on an integer 1–5 scale:

| Score | Meaning |
| --- | --- |
| 5 | All material source meaning and relations preserved; natural valid alternative wording allowed. |
| 4 | Main meaning and facts preserved; minor omission/awkwardness does not change the scene. |
| 3 | Understandable core but a significant detail, actor, condition, term or cue-local relation is wrong/absent. |
| 2 | Major distortion, omission or addition obscures who did what, when or why. |
| 1 | Reversal or essentially unusable translation of the source cue. |

Record separate flags for omission, addition, negation, actor/payer/payee,
direction/time, names, amount/currency/unit, approved term, register/speaker,
grammar, cue placement and scene continuity. Severity is `critical`, `major`,
`minor` or `none`; style preference without factual loss is separate. A critical
error materially reverses an assertion/negation, changes actor/action/time or
financial fact, invents a consequential fact, or omits content needed to
understand the scene. A major error loses meaningful detail without meeting that
threshold. Critical severity requires source span/scene evidence and second
reviewer disposition; an unresolved critical cannot pass G4. An automatically
detected protected-token failure is structural and rejected before language
scoring, while a syntactically valid but wrong payment relation remains a
language error.

Each judgment records corpus/source/scene/cue and candidate opaque ID,
source/reference hashes, reviewer ID and UTC, adequacy, category flags,
severity, cited source span, concise rationale, acceptable alternative or
proposed correction, applicable approved-term occurrences and observed matches.
Mark `uncertain` with the missing context and request adjudication. The second
reviewer adds an independent judgment; adjudication records the final outcome,
both IDs, reason and any changed eligibility. Do not overwrite either primary
sheet. A later correction is a new version with a link to the old one.

## Denominators and release decisions

Report `eligible`, `reviewed`, `unreviewed`, `excluded` and `uncertain` cues per
source, scene, category and script. The G3 numerator is eligible, independently
reviewed cues with final adequacy >=4; denominator is **all eligible frozen
holdout cues**, so missing review cannot improve the fraction. G3 needs at least
95% and complete eligible coverage. G4 needs zero unresolved critical errors
with all critical/disputed items adjudicated. The G5 denominator is all
applicable occurrences of approved terms in eligible cues; count agreed Russian
inflections and report mismatches/exceptions, with at least 98% matches. A zero
denominator is `not_applicable`, not 100%. Name/amount controls are reported
separately, even when not represented by glossary entries.

For paired development comparisons, use the same target IDs and review packet
for each candidate. Report win/loss/tie and regressions by case, including
unrelated-context susceptibility. Cluster neighboring cues by source/scene when
discussing uncertainty; do not treat them as independent samples for a spurious
precision claim. AI editorial comments, automatic checks and human blind scores
have separate fields and labels. A language release cannot pass from AI analysis
or absence of warnings.

Once a sealed cue is inspected to tune prompt, terms, decoding or weights, retire
its whole related source group to development in a new inventory version. Prepare
a new untouched holdout for the next release attempt. Keep all old scores and
failed model outputs. Do not change the adequacy rubric, categories or G3/G5
thresholds after seeing the candidate merely to obtain a pass.

## Reviewer availability and execution boundary

The 25 September [data protocol](001-open-data-and-language-gates.md) records no
approved bilingual reviewer. This turn requested current availability from the
owner; no reply or reviewer evidence is assumed here. EVAL-01 can freeze the
protocol and document the missing person, but `DATA-04`, `DATA-05`, `RELEASE-01`,
G3–G5 and audio listening remain incomplete until actual people and sources are
available. The next evaluation schema (`EVAL-02`) must preserve raw responses and
reviewer provenance without treating an AI field as a human score.

## EVAL-01 acceptance

`task plan:check` passed 49 stable task IDs, dependency ordering and linked done
evidence. `task docs:check` passed 103 local Markdown files. The reviewer
availability check found only the earlier explicit absence; no human coverage
or score is reported. This scoped protocol task is complete while its later
execution gates remain open.
