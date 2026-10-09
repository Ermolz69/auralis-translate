# Source-derived fact hints v1: bounded development screen

Date: 9 October 2026. The preceding [natural cue-seam result](2026-10-09-reg066-natural-seams-result.md)
rejected a blanket target shift. A generic instruction had also failed on
Vivo. This `CTX-03`/`EVAL-04` screen tests a different, narrow hypothesis:
facts extracted from exact Chinese source spans and attached to the relevant
target slot may reduce natural fact drift without changing requests for
unmatched slots. The extractor is evaluation-only until paired model and
negative-control evidence justify a product contract change. v8, the source,
all prior drafts and the failed outputs remain immutable.

## Deterministic extraction contract

Input is the already rendered v8 JSON envelope. The extractor reads only
`source_original`, cue ID and the one neighboring source cue on either side;
adjacent evidence must be no more than 4,000 ms away with no timeline overlap;
it does not read Russian output, a reference, a sealed holdout or a term
registry. It emits a `source_fact_hints` array inside **target slots only**.
Each hint records a kind, exact matching Chinese span and source cue IDs.
Fixed rule families:

1. `9400这1代` or `9400这一代` -> current 9400 generation, no explicit first
   ordinal. Explicit `第一代9400` -> explicit first ordinal.
2. `提前36个月` or `提前三十六个月` with neighboring `联合...规划定义`
   -> 36-month advance relative to that source planning phrase. Explicit
   `项目启动三十六个月之后` -> 36 months after project start.
3. `投了` followed by a neighboring `一千多人的...团队` -> team/headcount
   referent. The hint on the verb cue may name the later source cue as
   evidence but must not copy its number into the verb cue's translation.
   Explicit `一千万元` and `一千人的团队` in one cue -> both money and people.
4. `一两点钟` with immediately preceding `半夜` or `凌晨` -> 01:00–02:00;
   explicit `晚上十一二点` -> 23:00–00:00. No free clock inference.
5. `有更好的产品能够带给` with immediately preceding `期待` -> future
   expectation. Explicit `已经上市` -> present availability.

The source-derived labels and values are not a target-language reference.
Unknown, conflicting, distant or unsupported patterns produce **no hint**.
If no hint applies to the request, the full prompt bytes must equal v8.
When hints apply, only the additional field on matching target slots and
one fixed instruction sentence may differ. Context, target IDs, timestamps,
approved terms, protected money facts and model settings remain identical.
Hints are untrusted source evidence and never license a missing/extra ID,
cross-cue content or a checkpoint without the existing validator.

## Frozen screen and decision rule

After deterministic checks, freeze exact request hashes and this harness
before inference. Compare 7B Q4_K_M v8 baseline versus v8 plus hints on the
**same** five natural REG-066 original target groups, the five existing
negative REG-066 controls, and the two related plus two negative authored
controls from each of REG-067 and REG-068. These are known development
cases, not a sealed or human-reviewed holdout. One seed 101, one reply per
arm and case, alternating baseline-first/candidate-first by case index:
**36 chats**, **72 template/tokenizer preflights**, one model
server, zero retries, at most 100,000 prompt-plus-completion tokens,
120 seconds per chat and 12 minutes total. A pre-spawn permission failure
may be retried once only after its zero-call report is saved; other failures
remain failed. Retain every raw request, reply, usage count, process sample
and reason privately. Public evidence contains hashes, IDs and paraphrased
AI triage, without natural-source translated text.
The REG-067 original three-slot tail deliberately repeats the natural
cue-466 request as a structural control; it is not an independent sample.
Five authored pairs receive no hint and must have byte-identical baseline
and candidate requests. Such pairs test abstention and run variation,
not a treatment effect.

Reject the candidate if it introduces a missing/extra target ID, a new
major fact/language error on any natural or negative case, a copied context
fact into the wrong target, or a failure on the unrun related controls.
Do not promote from one seed even if all pass: repeat shortlisted cases,
test a second source family and obtain independent Chinese–Russian review
before a full-file candidate. Record both repairs and regressions, with
`needs_review` for ambiguous Chinese/Russian meaning. G3–G5 and
RELEASE-05 remain open.
