# Next bounded Goal assignments

Updated: 3 October 2026. These were the ready assignments, not acceptance records or
authorization to claim release quality. Run independent follow-ups on isolated clean
checkouts. The current product baseline is unchanged v8; the NAME-01 and EVAL-05
model extensions remain rejected. Preserve the shared checkout, foreign `014`
change, source media, old SQLite results and all failed observations.

NAME-02 now has [admission-only containment](../eval/experiments/2026-10-03-name-action-admission-v1-result.md)
with zero new model calls. TERM-02 has a [rejected 120-answer screen](../eval/experiments/2026-10-03-reg-062-occurrence-terms-v1-result.md).
The bounded assignments below remain the original instructions; the linguistic
fixes, independent review and full Goal remain open. Their combined regression
state is [catalog v44](../eval/regressions/catalog-v44.json).

## NAME-02

> Continue the Auralis Translate Goal on backlog `NAME-02`. Read `AGENTS.md`,
> `docs/README.md`, `docs/PRODUCT_PLAN.md`, `docs/DELIVERY_PLAN.md`,
> `docs/IMPLEMENTATION_BACKLOG.md`, `docs/AGENT_WORKFLOW.md`,
> `docs/RELEASE_ACCEPTANCE.md`,
> `docs/evaluation/008-regression-and-adversarial-checks.md`,
> `docs/architecture/016-source-name-registry.md`, the NAME-01 plan/result, and
> `eval/regressions/reg-063-name-proposal-neighbor-action-v1.json`. Inspect Git,
> models, runtime and hardware first. Preserve the original source, registry
> revisions and accepted results. The objective is to prevent a target-scoped
> name proposal from changing the target person's identity or action. Start with
> the frozen 84 responses: trace the exact target, neighbor context, proposal,
> request bytes, raw response and accepted checkpoint for the nine newly broken
> name/action observations. Use source facts to choose one narrow candidate;
> do not search multiple prompts until one happens to pass. Keep no-name request
> bytes identical to baseline v8 and proposals `needs_review`. If a reliable
> source-aware action check is not supported by evidence, fail closed with an
> explicit review/rejection outcome before checkpoint; do not silently correct
> a sentence or claim language approval. Add deterministic tests for REG-063's
> minimal reproduction, related and negative cases; include beginning/middle/end,
> scene and batch seams, similar names, negation and neighboring actions. Before
> any inference, add Taskfile probe/check commands and freeze code/model/GGUF/
> runtime hashes, source/context/split, expected source facts, one-factor arms,
> repetitions, token/time/memory budgets and stop rules. One candidate screen is
> permitted: at most 20 development cues, three paired runs per arm (120 chat
> calls total), no model retry for semantic failures, and no sealed holdout.
> Retain every raw and accepted output, prompt/token count, duration, resource
> sample, error, AI judgment and human-review count separately. Require zero new
> critical or major meaning/name/action errors across positives and unseen
> controls, plus unchanged no-name bytes, before considering a natural long-file
> probe. Otherwise reject the candidate and keep v8. Update regression catalog,
> backlog and evidence; run affected `task ...` checks, make small English commits
> with verified primary global Git identity and report rollback. Do not claim
> G3-G5, RELEASE-05, human review or full-file quality from this screen.

## TERM-02

> Continue the Auralis Translate Goal on backlog `TERM-02` after NAME-02's
> resource-intensive screen has ended. Read the same project instructions and
> regression policy, plus the EVAL-05 plan/result and
> `eval/regressions/reg-062-contrast-referent-contamination-v1.json`. Preserve
> unchanged v8 and the rejected REG-061 transformer. The defect is concrete:
> `鼠标垫缺货，鼠标支架仍有现货。` lost the distinct stand referent when a pad hint was
> applied. Diagnose the frozen request/raw response and define one source-grounded,
> target-only candidate that scopes each term to its exact source occurrence and
> does not import a hinted word into a contrasting unhinted referent. Preserve
> polarity, availability and both noun identities. When no applicable target
> occurrence exists, request bytes must equal v8. Do not use a general glossary
> hint, post-hoc exact-phrase replacement, or reference translations in prompts.
> Add Taskfile commands and deterministic tests for REG-062, its three unrun
> controls, REG-061 positives/negatives, reversed contrasts, negation, distinct
> speakers and seam positions. Freeze one candidate before model calls with
> identities, same-source paired v8 comparison, source-fact rubric and stop rule.
> The first screen is at most 20 development cues and three paired runs per arm
> (120 chat calls total), no semantic retry or sealed holdout. Retain rejected
> outputs and full tokens/time/resources/errors/review provenance. Advance only
> if the known positives improve without new major/critical fact, negation or
> referent failures in all controls; otherwise preserve v8 and record the failed
> candidate. Do not run the 268-cue file or claim G5/RELEASE-05 without separate
> source admission and independent review. Update backlog/catalog/evidence,
> rerun affected Taskfile checks, commit in small English steps with the verified
> primary global Git identity and give a safe rollback path.

## Shared gate after both assignments

These development screens cannot replace DATA-03/04/05, CTX-03, EVAL-04,
LONG-04, the independent G3-G5 review, or real Auralis listening. No volunteer
contact is authorized. Desktop remains deferred by the owner. A rejected
candidate is a valid bounded result; it leaves the full Goal open.

## Next executable assignments after both rejections

### EVAL-04 / CTX-03: source-fact admission screen

> Continue the Goal on the existing `EVAL-04` and `CTX-03` backlog work. Start
> from the retained REG-062 and REG-063 raw replies, the NAME-02 admission
> result and catalog v44. First diagnose whether one source-grounded, output-only
> guard can distinguish the missing stand, changed availability, changed person
> and copied neighboring action from valid alternative Russian wordings. Freeze
> explicit source facts and at least 20 new development controls before testing
> the guard. Use the existing 84 NAME-01 and 120 TERM-02 replies for an offline
> replay; make zero new model calls in this first screen. Record every caught
> major error, missed major error and false refusal with source interpretation
> and separate AI/human provenance. Implement a typed reject-before-checkpoint
> outcome only where the source-to-target assertion is defensible; abstain
> explicitly elsewhere. Do not rewrite the model's Russian sentence, add a
> general prompt, consume sealed holdout or promote a product profile. Add
> Taskfile commands, minimal/related/negative regressions, and exact evidence.
> Stop if the guard cannot protect both defect families without rejecting valid
> alternatives; preserve v8 and the failed result. Only a separately frozen
> same-source model comparison could justify later quality advancement.

### DATA-03: one eligible natural scene

> Continue the Goal on `DATA-03` using the existing source inventory and rights
> schema. Select one potentially licensed 10-20-minute Mandarin video with its
> matching original Chinese subtitle track, including a YouTube source only if
> its rights and media/caption alignment can actually be documented. Freeze URL,
> version, expected duration, retrieval attempts, size/time limits and failure
> handling before acquisition. Preserve original bytes and keep uncertain-rights
> media private. Verify caption grammar, timing containment, speech/cue alignment
> at the beginning, middle, end and scene boundaries; record who actually
> listened and what they heard. If no direct listening or rights evidence is
> available, retain the candidate with the precise missing gate and do not call
> it eligible. Add Taskfile checks and an immutable source inventory update.
> Do not use a sealed holdout or infer translation quality from alignment.

These assignments can run independently after the integrated evidence is
published. No volunteer outreach is authorized. Human Chinese-Russian review,
the owner-deferred desktop stage, clean Windows install and real Auralis media
listening remain separate requirements of the full Goal.

The 9 October [Vivo YouTube source screen](../eval/experiments/2026-10-09-youtube-manual-chinese-source-result.md)
identifies a regular Chinese caption track with 467 text-identical cues on
matching 18:36 media. Continue `DATA-03` with a private start/middle/end and
speaker-boundary listening packet for this exact hash-pinned version. Record
heard speech and cue alignment separately from machine timing containment;
do not promote the candidate while caption/audio rights and human review
remain unknown. The current ASUS original has a major duration discrepancy
and is excluded from this matched-version path.

The [three-window local ASR diagnostic](../eval/experiments/2026-10-09-vivo-audio-asr-triage-result.md)
shows broad topic overlap and retained recognition mistakes. It covers
only 36 seconds, with Mandarin forced and no human listener. Do not turn
this into a source-alignment or release score; use its uncertain words and
unsampled speaker boundaries to prioritize the next source-audio review.
