# Release acceptance and goal completion

Updated: 28 September 2026. This document binds the
[delivery plan](DELIVERY_PLAN.md) and [backlog](IMPLEMENTATION_BACKLOG.md) to
observable completion. It does not certify any unexecuted gate. The backlog owns
task status; this document owns acceptance definitions, not a second progress queue.

## Freeze the objective before the long execution

`PLAN-03` records the selected language, source formats, OS/backend, model/profile,
CLI versus desktop endpoint, translation versus audio milestone, required task
IDs, optional branches, authorized resources and unresolved external prerequisites.
Use one versioned scope record under `eval/experiments/`. Start with the existing
Chinese subtitle-to-Russian path on Windows and source-subtitle dubbing in Auralis.
Record the actual selected package/backend after measurements, not by inference.

Finishing every imaginable future item is not an objective. For the full current
delivery target, translation must pass G1–G9 and the real dubbing pilot must pass
the audio gates below. Japanese and ASR without subtitles are subsequent scopes.
Fine-tuning and higher precision are conditional branches: record why they are
accepted, rejected or unnecessary. Skipping an unnecessary training branch is a
decision, not evidence that training was performed.

Desktop UI remains owner-deferred. CLI/context/data work proceeds autonomously.
If the chosen full release requires deferred UI, identify the concrete final
slice and obtain the owner's scheduling decision then; do not claim the full
desktop release while substituting a CLI result. A finite CLI milestone may be
reported separately but cannot close a broader goal. Missing source-matched
references, licensed natural sources, a clean installation target or necessary
compute are real prerequisites, not reasons to invent evidence or lower a gate.

When scope changes, preserve the old scope record, explain the reason, identify
which gates/evidence are invalidated and obtain a decision for material user-facing
scope changes. Keep original media/results and unrelated working-tree changes.
Do not reopen completed baseline tasks to disguise a different acceptance target.

The owner's [translator-only scope v3](../eval/experiments/2026-10-10-translation-only-scope-v3.md)
supersedes the active audio work in scope v1 and the reviewer dependency in
scope v2. A1–A6 remain unpassed historical audio gates and are outside this
translator assignment. [Published-reference review v2](evaluation/011-published-reference-review-v2.md)
is the prospective G3–G5 route; no recruited bilingual auditor is required.
Published professional Chinese–Russian translations are reference material,
not independent ratings of our outputs or automatically approved terminology.
G3–G5 stay open until eligible matched subtitle evidence passes that protocol;
the six-case written-policy screen is development only.

## Translation gate bindings

Use the [product plan](PRODUCT_PLAN.md) for authoritative G1–G9 definitions.
The task mapping below requires evidence for the **same final candidate**, corpus
version and selected delivery endpoint. Previous narrow probes remain useful
regressions but are not sufficient release evidence.

| Gate | Required observed result | Backlog binding |
| --- | --- | --- |
| G1 structure | 100% supported cue/slot mapping and protected timing/settings/bytes retained; original immutable | RELEASE-02, LONG-05 |
| G2 coverage | Every source slot has an explicit outcome; a complete artifact contains all accepted translations, no silent omission or partial publication | RELEASE-02, CTX-05 |
| G3 adequacy | At least 95% of eligible holdout cues have source/reference-supported adequacy at least 4/5 under protocol v2; every cue assessed or counted as failure, AI basis and uncertainty reported | RELEASE-01, DATA-04, DATA-05 |
| G4 critical errors | Zero unresolved *detected* critical source-fact errors across the whole holdout and predeclared controls pass; exposed tuning groups retired; residual detection limits stated | RELEASE-01, EVAL-01 |
| G5 terminology | At least 98% of applicable pre-frozen source-grounded term occurrences match, allowing documented inflection; uncertain applicability fails, names/money controls reported | RELEASE-01, CTX-03 |
| G6 resources | Numeric SLA frozen after profiling, then passed for the selected hardware/backend, complete sources and measured cancellation/resource release | RELEASE-02, LONG-06 |
| G7 recovery | Accepted checkpoints/edits persist after the declared fault matrix; resume identity mismatch rejected; no duplicate accepted output | RELEASE-02, LONG-05, HOST-01, HOST-04 |
| G8 export | Result opens and behaves correctly in declared target consumers; lineage and offline re-export checked | RELEASE-02 |
| G9 installation | Selected package installed on an unseeded target and translates offline through the actual delivery endpoint | RELEASE-03, HOST-02, HOST-03 |

Both plain-SRT and strict plain-WebVTT are candidates, not automatically bundled
release claims. Record the admitted subset and execute applicable gates per format.
If one is excluded from the chosen release, retain its task/evidence and explain
the exclusion. No minimum VRAM or speed promise is inherited from a weight size.
No unverifiable probability of correctness is substituted for observed scores.

## Additional engineering acceptance

`EVAL-04` defines permanent regression tiers and adversarial/metamorphic controls in
[regression policy 008](evaluation/008-regression-and-adversarial-checks.md).
The final candidate must pass applicable source integrity, context isolation,
bounded failure/retry, token-budget and legacy identity checks. CLI error/progress
contracts remain versioned. Any language-review risk is visible to the caller;
absence of an automatic warning is not proof of language quality.

`HOST-04` exercises upgrade/rollback on owned database and package copies. Cover:
old checkpoints/results/edits, changed profile refusal, new-schema forward migration,
interrupted installation/migration, verified recovery from a backup and offline
export of old accepted results. A binary/schema downgrade may be unsupported;
reject it explicitly instead of opening a newer database with an incompatible
old binary. Rollback can mean restoring a verified compatible backup. Never run
destructive migration or downgrade probes on user project databases.

Upgrade acceptance includes source/result hashes, selected artifact association,
edit ancestry, package receipts and notices. A model switch starts a compatible
new run or rejects incompatible resume; it does not rewrite historical identity.
Bind runtime/profile changes and relevant corpus fingerprints to the release
dossier. Keep the previously verified runnable baseline for an explicit rollback.

## Audio pilot gates

These gates implement the proposed pilot in the delivery plan; fit/loudness limits
must be chosen from a measured baseline before the final pilot. They do not weaken
translation G1–G9 or certify hypothetical TTS engines.

| Gate | Required evidence | Backlog binding |
| --- | --- | --- |
| A1 approved lineage | Selected reviewed translation, source cue/timing and approved spoken-script/speaker/voice identities are recoverable | VOICE-01, VOICE-04 |
| A2 complete real speech | Every approved segment has decodable, playable real audio; no missing/duplicate segment, unmapped content or mock-only artifact | VOICE-02, VOICE-03 |
| A3 sound and fit | Documented clipping/sample-rate checks and frozen fit/overlap/mix limits pass; all shortening/stretching is recorded without unreviewed loss of meaning | VOICE-03, VOICE-07 |
| A4 listening | Three distinct 10–20-minute scenes; zero unresolved critical meaning/speaker errors; at least 95% eligible utterances rated at least 4/5 for intelligibility/naturalness | VOICE-04 |
| A5 full-length durability | At least one complete natural media source survives the declared restart/cancellation matrix, preserving translation and audio lineage within the resource budget | VOICE-05 |
| A6 delivery | Actual exported audio/video is played in declared consumers; listening coverage, rights, limits and rollback are recorded | VOICE-06 |

The speaker/voice regression set covers names, amounts, numbers, homographs,
abbreviations, questions, unfinished clauses and dialogue across a scene boundary.
Speech recognition of synthesized audio may assist triage, but it is not an
independent listener or a complete perceptual-quality score. Audio engine upgrades
need their own applicable regression slice. Whole-file listening coverage must be
reported; sampled listening cannot assert that every utterance was reviewed.

## Final audit dossier

`RELEASE-05` verifies the final candidate from the committed checkout on the selected
target, rather than accepting an earlier debug binary or a reused dirty cache.
Check required task status, identities, executable commands, artifacts, report/data
agreement, reference/assessor provenance and target-consumer behavior. Re-run affected checks
after fixes; no need to repeat expensive unaffected experiments without a reason.
Label any agent-run language audit self-audit and distinguish published reference,
AI assessment and actual human ratings. The current translator scope does not
require recruiting an external auditor; historical audio listening is unpassed.

The dossier records:

1. Frozen scope and required/optional/excluded task IDs, with reasons and backlog links.
2. Candidate model/runtime/profile/tokenizer/context/term and package hashes.
3. For each gate: target, observed numerator/denominator or timing/resource value,
   command/fixture/assessor identity, artifact link and explicit pass/fail/gap.
4. Applicable regression, long-file/fault, migration/rollback and offline-install evidence.
5. Remaining defects by severity, reviewed dispositions and unsupported combinations.
6. Release artifact hashes/notices, prior baseline and recovery instructions.
7. Git author/committer verification, published commit, CI/Pages result and live report.

A final evidence index may summarize gate decisions but cannot replace immutable
raw experiment records or the canonical backlog. New critical findings invalidate
the associated gate until fixed and rechecked. Record any change to a previously
frozen threshold before evaluating the new candidate; no threshold reduction just
to obtain a pass. Plan improvements add bounded tasks and acceptance, not unlimited
new features after the goal has already met its frozen definition.

## Completion versus an external prerequisite

Complete a bounded task only after its acceptance. Complete the full goal only
after all required scope tasks and gates pass, public evidence agrees with the
candidate and publication is verified. Deferred optional directions may remain
open with explicit exclusion/decision; required deferred or blocked work may not.

If a source/reference/target/authorization is missing, retain a concrete backlog
blocker, make independent progress and report the exact needed input. Apply the
available Goal tool's rules for goal-level blocked/paused/complete states; the
backlog's task states are not a substitute. A token/time limit or inability to
run the last real check is not success. Produce a resumable handoff with current
IDs, hashes, next task and the blocker rather than a fictitious completed release.
