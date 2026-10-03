# Frozen source name registry development screen v1

Date: 3 October 2026. NAME-01, partial CTX-03/EVAL-04/LONG-04 prerequisite.

Compare the checked 1.8B Q4_K_M v8 single-target baseline with the same v8 plus
the separately pinned name-proposal extension. This model has known REG-052 name
variation; the 7B comparisons remain immutable. The only intended factor is the
target-scoped registry. Three fresh durable runs per arm, counterbalanced order
(baseline/registry, registry/baseline, baseline/registry), same 14 authored Chinese
cues and two frozen scenes. CLI decoding stays at the baseline temperature/top-p/
top-k/repeat penalty. Seed is not exposed by this CLI; RNG seed is unknown and
the repetitions describe variation, not deterministic paired seeds. Cache effects
are shared/unknown; elapsed times are observations, not a speed benchmark.

Input is the authored development fixture
[source-name-registry-development-v1](../corpora/source-name-registry-development-v1.json).
No reference translation or sealed holdout is read. Proposed Russian names are
source-only Codex suggestions and have model provenance and `needs_review`, with
zero human approvals. Same-surname/full-name/address candidates remain distinct,
including identical surfaces in different scenes. The negative controls include
a neighbor-only name and a title compound containing an extracted surface.

`task eval:name-registry:freeze` writes immutable source/scene/proposal/profile
bytes plus model, runtime, CLI, harness and affected-code hashes before inference.
`task eval:name-registry:preflight` verifies the freeze. One permitted probe attempt
retains every failure; there is no resume, automatic retry or prompt search.
Budgets: at most 84 chat calls, 168 tokenizer/template requests, 256 output tokens
per chat, 2,048 context tokens with 64 safety tokens; at most 150,528 combined
input/output tokens (84 × 1,792), 120 seconds per chat, 180 seconds readiness,
six minutes per arm and 30 minutes total. All processes are owned scratch runs.
Abort on another running llama-server, exhausted budget, invalid/incomplete arm
or source mutation. Retain its SQLite/checkpoints/raw responses; no partial result.

Structural acceptance: all six runs complete 14/14 slots, original bytes unchanged,
all results `needs_review`, exact occurrence/scene/slot selection and rendered
token counts within budget. Negative target prompts must be byte-identical across
arms; name occurrence payloads must not leak the whole registry. Accepted checkpoint
text and hashes must match exported results. Resource sampling is every five
seconds, approximate process/device-wide memory, with measurement failures retained.

Advancement requires fewer repeated-name spelling inconsistencies in the registry
arm, with no newly introduced person/address/action/time/negation errors in a
separate source-aware AI assessment. Russian inflection is allowed; consistency
is not correctness of transliteration. Inspect all 84 outputs, not only positives.
Uncertainty counts against advancement. If baseline is already consistent or any
new semantic error appears, retain the experimental implementation but do not run
the full natural file. On a pass only, separately predeclare one bounded complete
development long-file run, then inspect beginning/middle/end, names and seams.
Independent Chinese–Russian review is unavailable; G3–G5 and RELEASE-05 stay open
regardless of the deterministic/AI decision. No volunteer messages are sent.

The engineering reproduction NAME-BUG-001 retains source `小王，请进。` followed
by `小王子是一本书。`: naive substring occurrence collection incorrectly linked
the book title to the person. A bounded suffix check and related `小王国` and
`王老师奖` controls now reject that link. This is an extraction defect, not a
model-quality score. Exact hashes and observed checks belong to the result record.

Pre-inference freeze correction: the first freeze is retained at
`.cache/eval/source-name-registry-v1/freeze.json` with zero model requests.
The full migration suite then exposed a v5 fixture that reset `user_version`
without dropping the new v10 registry tables. Correct that owned fixture to
actually represent v5, then retain a second freeze under `freeze-02/` before
model calls. This does not change source, model, prompt, budget or criteria.
