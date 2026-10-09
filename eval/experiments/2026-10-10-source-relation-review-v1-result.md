# Source relation review v1: three known errors warned

Date: 10 October 2026. This is the bounded offline `EVAL-04` replay in the
[frozen plan](2026-10-10-source-relation-review-v1-plan.md). It is not a
translation change, language score, human review or release acceptance.

## Inputs and observed result

The original-platform 467-cue Chinese SRT SHA-256 is
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
The complete v8/7B Russian draft is
`4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831`.
The earlier 36-chat paired journal is
`72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f`.
Every private input was rehashed before replay. The diagnostic rule SHA-256
is `215486c2a6fa85fc278ef84b28d0bd0abf7c99174311414aa982ab7c9b83c18a`.
The [source-free machine report](../reports/2026-10-10-source-relation-review-v1.json)
is `86900f84bc40afc63c46796bf4375e2d9096c13497a301c3dbda7d73ce3763b8`.

All 467 source/draft cue IDs and timing rows matched. The narrow rule
recognized **three** source relations and warned on all three known full-draft
errors: cue 276 invents an earlier stage before the 36-month joint plan;
cue 280 turns the thousand-person team referent into money; cue 466 asserts
current products where the preceding speaker expresses future expectation.
On the three saved baseline/candidate pairs, it warned on **5/6** replies.
The one unflagged rejected-hint reply for cue 466 is **not** certified: the
earlier AI review still found agency uncertain. The other 464 source cues
were not recognized by these rules; an absent warning says nothing about
their quality.

Four deterministic test groups cover the three minimal failures, related
Chinese/Russian forms, explicit after-start planning, explicit money, already
available products, correct paraphrases, negation and cue ID/timing seams.
The first test run failed in three groups because two authored neighbors
overlapped in time and the related future-product phrasing was unsupported.
The fixture timing and narrow phrasing rule were corrected before replay;
the failed attempt remains in this record. `task eval:source-relations:unit`
then passed 4/4 groups; `task eval:source-relations:report` captured the
above result. Zero new model, ASR or TTS requests; zero retries. Chinese and
Russian text remain only in the private inputs, not the public report.

## Decision and next gate

Keep this **evaluation-only review warning**. No product acceptance, prompt,
profile, SRT or checkpoint changed. There is no measured false-positive rate
on a second natural source family and no independent Chinese–Russian reader.
The check cannot repair the errors or satisfy G3–G5, `LONG-04`, `VOICE-01`
or `RELEASE-05`. Next use a separate source family and blind review to test
warning precision, while obtaining a meaning-correct candidate and an
approved spoken script. Rollback is the unchanged v8 profile and stored
full-draft artifacts; removing this `eval/` rule leaves them untouched.
