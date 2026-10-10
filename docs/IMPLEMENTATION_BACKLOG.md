# Tracked implementation backlog

Updated: 2026-10-09. Canonical task state for the
[delivery plan](DELIVERY_PLAN.md). This replaces the temporary S0–S9 work queue;
their product/format acceptance criteria remain applicable. Historical evidence
is in [implementation status](IMPLEMENTATION_STATUS.md).

## Status and accounting rules

- `done`: named acceptance verified with linked evidence; its scope is not expanded by implication.
- `ready`: prerequisites are done and the next bounded slice can begin.
- `in_progress`: an agent is implementing the named slice; record what remains.
- `planned`: waiting for dependencies or scheduling; no implementation claim.
- `deferred`: conditional work or work intentionally postponed by the owner.
- `blocked`: a concrete external prerequisite is missing; record it and the unblock action.

Each ID is stable. Dependencies are comma-separated IDs or `-`. Done tasks must
link an evidence/acceptance record. Change state and evidence with the associated
implementation; never mark a gate done from mocks or compilation. Add new tasks
rather than broadening a completed task. `ready` and `done` require all declared
prerequisites done. Release readiness is determined by gates, not done/total.
Optional adaptation does not block a successful unadapted translation release.
The [release acceptance map](RELEASE_ACCEPTANCE.md) defines finite goal scope,
G1–G9/A1–A6 and the final audit. The [regression policy](evaluation/008-regression-and-adversarial-checks.md)
defines future-check maintenance. The [reusable goal objective](GOAL_PROMPT.md)
does not activate implementation by being stored here.

## Task table

NAME-01 is explicitly split from the unfinished CTX-03 language-review task for
the owner's bounded source-name registry request. Its acceptance covers durable
source-only extraction, target isolation, revision refusal and a frozen paired
development decision; independent approval and natural-file quality stay open.

| ID | Work | Status | Depends on | Acceptance / evidence |
| --- | --- | --- | --- | --- |
| BASE-01 | Strict source/result and checkpoint foundation | done | - | Narrow implemented slices only; open S7–S9 retained in [status](IMPLEMENTATION_STATUS.md) |
| BASE-02 | Real synthetic long-file recovery baseline | done | BASE-01 | Existing bounded scope and [recovery evidence](../eval/experiments/2026-09-26-long-file-recovery.md) |
| BASE-03 | Matched 1.8B/7B development comparison | done | BASE-01 | 240 real requests, AI editorial review and [experiment](../eval/experiments/2026-09-27-model-size-comparison.md) |
| PLAN-01 | Delivery plan, canonical progress and agent rules | done | BASE-03 | Documents/generated task progress; plan/docs/site and browser DOM checks passed; [acceptance record](../eval/experiments/2026-09-28-delivery-plan.md) tracks publication |
| PLAN-02 | Audit planning gaps and define goal completion | done | PLAN-01 | Release/regression/goal contracts, 49-task dependencies, six document identities and checked progress; [audit record](../eval/experiments/2026-09-28-goal-plan-audit.md) |
| PLAN-03 | Freeze finite execution scope and gate bindings | done | PLAN-02 | [Scope v1](../eval/experiments/2026-09-28-goal-scope-v1.md): required/optional/excluded IDs, resources, gate bindings and external prerequisites; deferred UI remains required |
| DATA-01 | Source rights, provenance, scene and split schema | done | BASE-03 | [Inventory v1](reference/source-inventory-v1.md), authored [checked example](../eval/corpora/source-inventory-example-v1.json), seven semantic tests and fixture SHA; real source admission remains open |
| DATA-02 | Sixty context contrast cases | done | DATA-01, CTX-01 | [Corpus acceptance](../eval/experiments/2026-09-28-context-contrasts-v1.md): 60 targets, 240 paired scenarios, frozen IDs/hash and source-only request projection; AI-authored development data, no human score |
| DATA-03 | Licensed development subtitle scenes | in_progress | DATA-01 | Four [initial Commons candidates](../eval/experiments/2026-09-29-commons-candidate-parser-recheck.md) retained 488 inspected cues. The [Mingfay Mandarin derivative](../eval/experiments/2026-09-29-youtube-mingfay-caption-candidate.md) added 230; its [media GET failed at HTTP 403](../eval/experiments/2026-09-29-mingfay-media-download-failure.md) and the [same-source 1.8B/7B screen](../eval/experiments/2026-09-29-mingfay-natural-model-screen-results.md) remains private and unreviewed. The [93-cue Ying run](../eval/experiments/2026-09-30-commons-ying-guarded-full-result.md) was structurally complete but had major source-fact and polarity defects. The [20:30 train video](../eval/experiments/2026-09-30-commons-train-240p-stream-result.md) now has a verified 240p VP9/Opus copy, without verified Chinese speech. The [18:36 Vivo/MediaTek interview](../eval/experiments/2026-09-30-geekerwan-vivo-caption-result.md) adds 467 strict Chinese cues and potential multiple speakers; its [matched 240p video and three decoded source-audio samples](../eval/experiments/2026-09-30-commons-vivo-media-samples-result.md) await actual listening and cue alignment. Two [further 14:42/12:42 Geekerwan candidates](../eval/experiments/2026-09-30-geekerwan-two-scene-captions-result.md) add 268/304 strictly parsed Chinese cues; their [matched 240p videos and six measured but unlistened audio samples](../eval/experiments/2026-09-30-geekerwan-two-scene-media-result.md) are private. The [Kirin original-platform metadata check](../eval/experiments/2026-10-02-youtube-geekerwan-kirin-license-result.md) found an advertised Chinese SRT and a 90,182 ms duration discrepancy from the retained Commons media; rights and alignment remain unverified. A hash-pinned private review packet now links all nine Geekerwan audio windows to overlapping source cues; its human review count is zero. The [restaurant stream derivative](../eval/experiments/2026-10-01-sethlui-stream-derivative-result.md) adds 263 strictly parsed cues after measured media-duration containment; eight late original cues remain excluded. [Three cue-linked audio windows](../eval/experiments/2026-10-01-sethlui-audio-windows-result.md) decoded, with zero human listeners and unresolved speech/rights. The [current original-platform Kirin SRT](../eval/experiments/2026-10-02-kirin-original-caption-and-media-result.md) adds 343 strict cues, 39 beyond the older media; bounded original-video requests returned HTTP 302 then 403 with no media retained. The [cross-inventory correction](../eval/experiments/2026-10-02-cross-inventory-leakage-guard-result.md) found Ying twice in the historical count; the then-current set had 11 candidate tracks, 10 media groups, 3,243 inspected cue slots and **zero eligible** cues. The [Chinese Wikipedia lesson source screen](../eval/experiments/2026-10-02-commons-wikipedia-lesson-source-result.md) adds a matched 3:59 Commons OGV and 37 mapped strict-SRT cues, bringing the current set to **12 tracks, 11 media groups, 3,280 inspected cue slots and zero eligible cues**; original timing, private media and unreviewed status are retained. Historical 12/3,336 observations remain preserved. A [two-source VOA Mandarin metadata screen](../eval/experiments/2026-10-02-voa-mandarin-caption-inventory-result.md) found no original or automatic Chinese subtitle tracks on either 20:05/10:56 original video and added zero eligible cues; the sandbox child-process failure is retained. Rights, speech alignment, scene/speaker boundaries, independent references and approximately 200 eligible development cues remain open; historical Commons/Amara provenance findings remain linked above. |
| DATA-04 | Sealed independent release holdout | ready | DATA-01, EVAL-01 | At least 300 eligible cues; independent groups/references, no tuning exposure; reviewer/source admission still needed |
| DATA-05 | Audit alignment, leakage and reviewer coverage | planned | DATA-03, DATA-04 | [Exact cross-inventory identity guard](../eval/experiments/2026-10-02-cross-inventory-leakage-guard-result.md) catches identical subtitle bytes and media aliases; [historical text-overlap screen](../eval/experiments/2026-10-02-cross-group-caption-overlap-result.md) checked 54 cross-group pairs with zero flags and recorded Kirin version overlap; the [lesson source screen](../eval/experiments/2026-10-02-commons-wikipedia-lesson-source-result.md) extends that frozen method to 65 current cross-group pairs, still zero flags. Full edited near-duplicate, alignment, rights, reference and reviewer coverage audit still awaits DATA-03/04 |
| EVAL-01 | Blind review, scoring and adjudication protocol | done | BASE-03 | [Protocol v1](evaluation/009-blind-source-review.md): source-aware rubric, critical taxonomy, denominators, adjudication and explicit reviewer absence; no human score claimed |
| CTX-01 | Specify composable prompt v5 | done | BASE-03 | [v5 contract](reference/chinese-context-profile-v5.md): source-only scene windows, approved terms, fidelity, identity, token budget and strict slot mapping; documentation checks only |
| CTX-02 | Implement v5 without changing v1–v4 | in_progress | CTX-01, DATA-02, CTX-05 | [V5 envelope](../eval/experiments/2026-09-28-v5-envelope-evidence.md), [scene-map checks](../eval/experiments/2026-09-28-scene-map-admission.md), [paired real scenes](../eval/experiments/2026-09-28-scene-context-results.md), [failed actor-number instruction](../eval/experiments/2026-09-28-scene-number-repair-results.md), [term admission](../eval/experiments/2026-09-28-v5-terms-admission.md), [real paired term probe](../eval/experiments/2026-09-28-v5-terms-paired-results.md), [typed retry regression](../eval/experiments/2026-09-28-typed-provider-retry.md), [inference journal checks](../eval/experiments/2026-09-29-inference-request-journal.md), [HTTP error-body regression](../eval/experiments/2026-09-29-inference-http-failure-body.md), [real paired journal run](../eval/experiments/2026-09-29-inference-journal-paired-results.md), [7B actor-number screen](../eval/experiments/2026-09-29-context-7b-p01-screen-results.md), [real token-preflight journal](../eval/experiments/2026-09-29-inference-preflight-p01-results.md), [four-scene cross-model comparison](../eval/experiments/2026-09-29-pronoun-cross-model-results.md), [inconclusive target-slot schema ablation](../eval/experiments/2026-09-29-slot-schema-ablation-results.md), [CLI model preflight journal](../eval/experiments/2026-09-29-cli-model-preflight-journal.md), and [local Auralis executor preflight journal](../eval/experiments/2026-09-29-auralis-host-preflight-journal.md): source-scoped ledger, frozen prompt identity, transient-only bounded retry and CLI v5 chat plus tokenizer-attempt persistence implemented and verified on authored short scenes; both model sizes repeat the singular actor defect, while CLI and local Auralis executor model verification are journaled; earlier Auralis runtime acquisition, explicit host-job correlation, long-file quality and human review remain open |
| CTX-03 | Scene terms and speaker evidence | planned | DATA-03, CTX-01 | [Term admission](../eval/experiments/2026-09-28-v5-terms-admission.md) is an engineering contract only; independent terminology review and speaker evidence remain open |
| NAME-01 | Durable source-scoped Chinese name registry | done | CTX-01, BASE-01 | [Scoped engineering acceptance and rejected model extension](../eval/experiments/2026-10-03-source-name-registry-v1-result.md): 14 focused tests, 275 workspace passes, immutable SQLite revisions, fresh-worker recovery and 84 real paired answers; consistency partly improves but new name/action errors reject long-file advancement. Human approval, CTX-03/EVAL-04 and G3–G5 remain open |
| NAME-02 | Prevent source-name proposals from changing target actions or identities | done | NAME-01, EVAL-02 | [Scoped safety containment](../eval/experiments/2026-10-03-name-action-admission-v1-result.md): nine frozen errors traced, 33/33 proposal replies blocked before checkpoint and 20 deterministic controls; unchanged no-name v8 requests and old results preserved. No reliable semantic verifier or quality advancement; G3-G5, RELEASE-05 and human review remain open |
| TERM-02 | Preserve contrast referents under target-scoped term hints | done | EVAL-05, EVAL-02 | [Bounded screen and rejected candidate](../eval/experiments/2026-10-03-reg-062-occurrence-terms-v1-result.md): 9 deterministic scope tests, 120 paired real replies and 240 preflights; both known positive concepts improve but the stand referent is lost in all three REG-062 candidate runs. Product v8 stays unchanged; actual contrast preservation, independent review and natural-file quality remain open in CTX-03/EVAL-04 |
| CTX-04 | Paired context/model ablation | planned | CTX-02, CTX-03, EVAL-01 | Budgeted repeated 60-case comparison, unrelated/insufficient-context controls and blinded review |
| CTX-05 | Specify bounded failure, retry and review policy | done | CTX-01, EVAL-02 | [Policy v1](reference/bounded-failure-policy-v1.md) and [invalid-slot retry regression](../eval/experiments/2026-09-28-invalid-slot-retry.md); typed provider errors/raw attempts remain for CTX-02 |
| EVAL-02 | General comparison and evidence schema | done | CTX-01, EVAL-01 | [Record v1](evaluation/010-comparison-record-v1.md), fixture-only [example](../eval/reports/experiment-record-example-v1.json) and seven schema tests; real comparisons remain open |
| EVAL-03 | Context and long-file HTML presentation | planned | EVAL-02, CTX-04 | Same evidence identities; scene/target/seam views, review labels, counts, public rights and raw downloads |
| EVAL-04 | Implement maintained regression and adversarial tiers | in_progress | CTX-01, EVAL-02 | [Initial index](../eval/experiments/2026-09-28-regression-index-v1.md), [REG-002 scene actor evidence](../eval/experiments/2026-09-28-scene-context-results.md), [failed instruction repair](../eval/experiments/2026-09-28-scene-number-repair-results.md), [current-template recurrence](../eval/experiments/2026-09-28-scene-pronoun-after-terms-results.md), [7B recurrence](../eval/experiments/2026-09-29-context-7b-p01-screen-results.md), [four-scene 1.8B/7B controls](../eval/experiments/2026-09-29-pronoun-cross-model-results.md), [typed retry regression](../eval/experiments/2026-09-28-typed-provider-retry.md), [REG-009 durable identifier diagnostic](../eval/experiments/2026-09-29-reg-009-identifier-diagnostic.md), [negative matched prompt screen](../eval/experiments/2026-09-29-reg-009-prompt-screen-results.md), [REG-010 neighbor-content reproduction and time warning](../eval/experiments/2026-09-29-reg-010-neighbor-content.md), [REG-011 1.8B/7B exact-fact and singular-door comparison](../eval/experiments/2026-09-29-long-v6-code-model-screen-results.md), [REG-015 mixed-script repair fixture](../eval/experiments/2026-09-29-reg-015-mixed-script-prefix-repair.md) and [64-seed SRT generated checks](../eval/experiments/2026-09-29-srt-generated-roundtrip-results.md) retain raw failures and structural controls; [REG-051 real v7 context-money leak](../eval/experiments/2026-10-02-v7-authored-batch-result.md) now has a retained wrong accepted response, a narrow reject-before-checkpoint guard and related controls; model fact preservation, broader generative/metamorphic and language coverage remain open under [policy](evaluation/008-regression-and-adversarial-checks.md) |
| EVAL-05 | REG-061 target-scoped provisional term development screen | done | CTX-01, EVAL-02 | [Scoped acceptance and rejected candidate](../eval/experiments/2026-10-03-reg-061-target-terms-v1-result.md): 7 deterministic scope tests, 30 real paired answers, 60 preflights and 8 byte-identical excluded-term pairs; both original positives repaired and known negatives preserved, but a new contrast loses the stand referent. Candidate rejected, product v8 unchanged, no full-file run or human/release gate claim |
| LONG-01 | Token-budgeted scene and batch planner | planned | CTX-02, CTX-03 | [Partial real 2,048-token preflight](../eval/experiments/2026-09-28-scene-context-results.md), [owned 1,024/4,096/10,000-target planner checks](../eval/experiments/2026-09-28-long-scene-planner.md) and [archived 268-cue rendered-token audit](../eval/experiments/2026-10-01-asus-v6-token-budget-audit-result.md): every tokenizer count matched server usage, maximum 300/1,728 prompt tokens and no context trim in that one-slot run; multi-target sizing, longer natural distributions and quality remain open. The [opt-in v7 batch implementation and failed real authored screen](../eval/experiments/2026-10-02-v7-authored-batch-result.md) add rendered-token splitting, exact multi-slot mapping and journal v9, but 1.8B copied a money fact from context; REG-051 now rejects that cue before checkpoint. The frozen 1-vs-4 run stopped on batch 1, so no batch gain is claimed |
| LONG-02 | Batch and seam-shift ablation | planned | LONG-01, CTX-04, EVAL-02 | Batches 1/4/8, shifts 0/1/3 on retained scenes; paired seam/interior review. The [opt-in v8 authored 1/4 screen](../eval/experiments/2026-10-02-v8-authored-cli-result.md) completed both sizes after a [12-response target-first order comparison](../eval/experiments/2026-10-02-v7-target-first-order-result.md), but one non-repeated four-cue run is not a timing or long-file quality ablation. REG-052 name/question issue remains; natural seams and human review open |
| LONG-03 | Engineering soak ladder | planned | LONG-01, EVAL-02 | 1024/4096/10000-cue owned fixtures; [v5 model rejection](../eval/experiments/2026-09-29-long-v5-scene-failure.md) and [v6 runner timeout](../eval/experiments/2026-09-29-long-v6-scene-timeout.md) remain failures; [copied-state recovery](../eval/experiments/2026-09-29-long-v6-postlength-results.md) yielded one structurally complete 1,024-cue synthetic SRT after a separately retained harness failure, but 665/1,280 lines lost or changed source identifiers; the [opt-in repair run](../eval/experiments/2026-09-29-reg-009-long-cli-soak-results.md) recovered 16 saved blocks then safely stopped at cue 89 after a Cyrillic code transposition, with 88 checkpoints and no result; longer tiers, natural quality and full stage acceptance remain open |
| LONG-04 | Complete natural-file quality pilot | planned | DATA-03, LONG-02, EVAL-01 | Three distinct sources, duration-tier gaps explicit; stratified and risk/boundary review |
| LONG-05 | Extended interruption and rejection matrix | planned | LONG-03 | Runtime/CLI/pause/disk/OOM/mismatch probes; durable prefix, edits, no partial result |
| LONG-06 | Stage timing, resource lease and SLA | planned | LONG-03, LONG-04, LONG-05 | Measured startup/decode/commit/export; declared resource limits and cancellation release |
| DECIDE-01 | Choose translation candidate and training need | planned | CTX-04, LONG-04, LONG-06 | Source-aware decision; target error families, quality/speed budget, baseline rollback; [synthetic 1.8B/7B screen](../eval/experiments/2026-09-29-long-v6-code-model-screen-results.md) improves code preservation with 7B but adds a confirmed singular-to-plural meaning error and higher latency/RAM, so no candidate or training decision is made |
| TUNE-01 | Fine-tuning data and compute feasibility | deferred | DECIDE-01, DATA-01 | Conditional: licensed independent training split, pinned recipe, memory/cost pilot |
| TUNE-02 | LoRA/QLoRA development pilot | deferred | TUNE-01, EVAL-02 | Conditional: reviewed domain examples, general controls, adapter identities and learning curves |
| TUNE-03 | Merge, convert and deployment-format comparison | deferred | TUNE-02, LONG-04 | Conditional: checkpoint/adapter/merged/GGUF evidence, quantization loss and rollback |
| PRECISION-01 | Isolated higher-precision comparison | deferred | DECIDE-01, EVAL-02 | Conditional on resource headroom/error hypothesis; same model/data/policy, actual quantization tradeoff |
| HOST-01 | Close historical-branch publication interruptions | in_progress | BASE-01 | [Uncertain commit-response regression](../eval/experiments/2026-09-29-host-publication-uncertain-commit.md) retains staged bytes for a committed or unreadable journal on SRT/WebVTT; [native staged/outbox process-kill](../eval/experiments/2026-09-29-host-historical-staged-gap.md) recovered one authored two-cue branch while preserving an explicit older selection; other interleavings, full recovery matrix and clean install remain open |
| HOST-02 | Clean distribution and selected backend package | planned | DECIDE-01 | Versioned installer/runtime/assets, archive-limit resolution if CUDA selected, real clean/offline install |
| HOST-03 | Final native review and candidate selection UI | deferred | DECIDE-01, HOST-01, HOST-02 | Owner-deferred UI milestone; actual model identity/review/attach/pause/restart through both databases |
| HOST-04 | Verify upgrade, compatible rollback and old results | planned | HOST-02, BASE-01 | Owned DB/package copies; interrupted migration/install, edits/history, identity refusal, backup restore and offline export |
| RELEASE-01 | Frozen Chinese holdout and term gates | planned | DECIDE-01, DATA-04, DATA-05, EVAL-02 | Blind G3/G4/G5; profile choice includes explicit accepted or rejected adaptation decision |
| RELEASE-02 | Translation reliability and export gates | planned | LONG-05, LONG-06, HOST-01 | G1/G2/G6/G7/G8 evidence for the exact release profile and supported format |
| RELEASE-03 | Clean Windows and desktop release gate | deferred | HOST-02, HOST-03 | G9 unseeded/offline and final native workflow, no mock substitute |
| RELEASE-04 | Chinese translation release candidate | planned | RELEASE-05 | G1–G9 decision record, notices, hashes, rollback and explicit exclusions |
| RELEASE-05 | Audit committed final candidate and regression dossier | planned | RELEASE-01, RELEASE-02, RELEASE-03, EVAL-04, HOST-04 | Gate/artifact/identity agreement, exact-target checks, publication and reviewed severity dispositions; [current committed-candidate self-audit: failed](../eval/experiments/2026-10-02-release-05-audit-attempt-v8.md), [previous natural v8 self-audit: failed](../eval/experiments/2026-10-02-release-05-audit-attempt-v6.md), [current v7 committed-candidate self-audit: failed](../eval/experiments/2026-10-02-release-05-audit-attempt-v5.md), [preceding committed-candidate self-audit: failed](../eval/experiments/2026-10-02-release-05-audit-attempt-v4.md), [earlier committed-candidate audit attempt: failed](../eval/experiments/2026-10-01-release-05-audit-attempt.md), [earlier incomplete self-audit](../eval/experiments/2026-10-01-release-readiness-after-original-track.md), [restaurant recovery self-audit](../eval/experiments/2026-10-01-release-readiness-after-sethlui-resume.md), [restaurant model self-audit](../eval/experiments/2026-10-01-release-readiness-after-restaurant-model-screen.md), [restaurant stream self-audit](../eval/experiments/2026-10-01-release-readiness-after-restaurant-stream.md), [previous source self-audit](../eval/experiments/2026-10-01-release-readiness-after-source-admission.md), [context-width self-audit](../eval/experiments/2026-10-01-release-readiness-after-context-width.md), [audio self-audit](../eval/experiments/2026-09-30-release-readiness-after-natural-audio.md) and [acceptance](RELEASE_ACCEPTANCE.md) |
| VOICE-01 | Reviewed spoken-script handoff contract | in_progress | CTX-01, EVAL-01 | Auralis local `feat/real-tts-pilot` commits `bc71330`, `13c9df7` and `770760a` bind selected verified result, cue/timing/speaker/voice and separate adaptation review fields with [opaque verified lineage](../eval/experiments/2026-09-28-voice-handoff-immutability.md) and a [two-database revalidation guard](../eval/experiments/2026-09-29-voice-selection-reverify.md); local `3000d6a` adds [ordered per-cue voice mapping](../eval/experiments/2026-09-29-sapi-multivoice.md); [private real-SAPI application stage](../eval/experiments/2026-09-29-auralis-private-speech-stage.md) at local `1a9ce76` reverifies before/after TTS and cleans stale private WAVs; [managed real-SAPI batch publication](../eval/experiments/2026-09-29-auralis-managed-speech-publication.md) at local Auralis `3261502` persists 2/2 WAVs with selected-result SQLite guard and outbox finalization in a synthetic two-database fixture; real reviewer identity/evidence, production worker wiring and selection-conditional final media publication remain open |
| VOICE-02 | Real Russian TTS selection and adapter | planned | VOICE-01, LONG-06 | Auralis-owned real audio, resource lease, engine/voice identity and cancellation; exploratory Windows SAPI adapter and failed two-cue fit at Auralis `2812bc2`, [synthetic media and FFplay process check](../eval/experiments/2026-09-29-sapi-synthetic-media.md) at local `a468801`, [real one-boundary cancellation cleanup](../eval/experiments/2026-09-29-sapi-cancellation.md) at local `5c6e38c`, [two-voice synthesis with failed original cue fit](../eval/experiments/2026-09-29-sapi-multivoice.md) at local `106ecdf`, [two-voice synthetic media playback](../eval/experiments/2026-09-29-sapi-multivoice-media.md) at local `c788ddc`, and [real private application-stage synthesis](../eval/experiments/2026-09-29-auralis-private-speech-stage.md) at local `1a9ce76`/`15485b6` with 2/2 decoded WAVs but failed 1-second-window fit do not satisfy dependencies or A2/A3 |
| VOICE-03 | Duration fit, mixing and mux policy | planned | VOICE-02 | [Private tempo-only fit screen](../eval/experiments/2026-09-29-sapi-original-window-fit.md) at local Auralis `0afa465` puts two real SAPI WAVs into synthetic cue windows; 1.533×/1.736× speech remains unlistened. The [268-cue natural-source feasibility screen](../eval/experiments/2026-10-01-asus-audio-fit-feasibility-result.md) at local Auralis `87544f3`/`8cf5c31` found 47/268 mathematical fits at 1.5× and 155/268 at 2× after a 75-ms margin. The [restaurant packet-boundary regression](../eval/experiments/2026-10-02-sethlui-packet-boundary-result.md) at local Auralis `02eed75` checked 36,904 real MKV packets and repaired an FFprobe CSV side-data parser. The [467-WAV unchanged-audio grouping screen](../eval/experiments/2026-10-10-vivo-group-fit-result.md) at local Auralis `4c44555`/`3d20480` found an optimistic whole-file 2.057× requirement and rejected grouping alone. The [467-WAV edge-silence screen](../eval/experiments/2026-10-10-vivo-edge-silence-result.md) at local Auralis `18b96fa`/`7b2b06d` still leaves 187,273 ms at ideal 1.5× after the broadest potential trim; the [same-text voice contrast](../eval/experiments/2026-10-10-vivo-sapi-voice-contrast-result.md) rejected Pavel, while the [SAPI rate screen](../eval/experiments/2026-10-10-vivo-sapi-rate-result.md) advanced only to private audition. No tempo policy or sound is approved, and reviewed meaning, natural scenes and production media orchestration remain open |
| VOICE-04 | Human-listened three-scene dubbing pilot | planned | VOICE-03, RELEASE-01, VOICE-07 | Reviewed translation input, 10–20-minute scenes, proposed audio gates and reviewer evidence |
| VOICE-05 | Full-length dubbing soak and recovery | planned | VOICE-04, LONG-04, RELEASE-02 | Real complete media, no missing/duplicate audio, resume and resource contention evidence |
| VOICE-06 | Dubbing pilot release decision | planned | VOICE-05, RELEASE-04 | Playback/listener results, media provenance and audio limits separate from translation gate |
| VOICE-07 | Maintain speech and pronunciation regression controls | planned | VOICE-01, EVAL-04 | [Packet-boundary controls](../eval/experiments/2026-10-02-sethlui-packet-boundary-result.md) now reject delayed start, missing tail, reversed timestamps, excessive preroll/overlap and invalid packet durations in fixtures; real names/amounts/homographs/scene-boundary audio, lineage, fit/clipping and listening controls remain open |
| ASR-01 | Transcript creation/alignment without source subtitles | deferred | VOICE-01 | Separate Auralis real ASR contract and recognition/alignment evaluation; not needed for subtitle pilot |

| LANGUAGE-01 | Separate Japanese admission and release evidence | deferred | RELEASE-04 | Japanese scenes, names, context, reviewers and independent G1–G9; no Chinese transfer claim |

The 9 October [YouTube source-version screen](../eval/experiments/2026-10-09-youtube-manual-chinese-source-result.md)
advances `DATA-03` without changing its `in_progress` state. The Geekerwan
Vivo interview has an original-platform regular Chinese SRT, 467 cue texts
identical to the retained 18:36 copy and only eight timing rows differing by
one millisecond. Its creator/video license field reports CC Attribution;
caption authorship, separate audio rights, actual speech alignment and
human review remain open. The current ASUS original is 492,777 ms longer
than its archived media and cannot be paired with that copy. No new source
or cue was admitted; the inventory still has 12 tracks, 11 media groups,
3,280 inspected cue slots and zero eligible cues.

The separately bounded [local source-audio ASR triage](../eval/experiments/2026-10-09-vivo-audio-asr-triage-result.md)
compares 36 seconds at the beginning, middle and end of the matched Vivo
video without supplying captions to the model. All three raw transcripts
have broad topic overlap with the corresponding SRT cues, with several
explicit recognition errors. Mandarin was forced rather than independently
detected; no person listened or mapped speakers. `DATA-03` stays in progress
with zero newly eligible cues. This diagnostic does not activate `ASR-01`.
The consolidated [18:36 scene selection and three-point speech screen](../eval/experiments/2026-10-09-youtube-chinese-scene-selection-result.md)
rechecked the retained caption, media and audio hashes and identifies the
specific cue/time agreements and ASR errors. The Commons video page still
awaits license review, and the regular Chinese track's authorship and rights
are unresolved. This pair is suitable only for private `needs_review`
development diagnostics until source listening and rights are established;
the scene selection itself does not admit any cues or close G3–G5/A1–A6.
The [10 October source recheck](../eval/experiments/2026-10-10-youtube-vivo-source-recheck.md)
reran both pinned private caption and three-window ASR checks successfully.
The creator's separate Bilibili post adds a no-repost notice to the open
cross-platform rights review; the YouTube CC metadata and Chinese-caption
authorship remain distinct facts. No source or release gate was promoted.

The [original-platform Vivo v8 long-file screen](../eval/experiments/2026-10-09-vivo-original-v8-long-result.md)
adds partial `CTX-02`/`LONG-01`/`LONG-02`/`LONG-04`/`EVAL-04`/`DECIDE-01`
evidence on the same 467-cue source: 1.8B stopped safely after 112 cues,
while 7B produced 467/467 mapped cues and a byte-identical offline export
from a copied database. AI review found recurrent timing, workforce and
future-product errors in the complete 7B result; no human adequacy score or
approved script follows. [REG-065](../eval/regressions/reg-065-vivo-v8-terminal-line-break-v1.json)
captures the 1.8B trailing-line-break failure with nine related/negative
controls. A narrow provider normalization passed deterministic tests, but no
real full-file recheck of the changed binary has run. `LONG-04` remains planned
because admitted distinct scenes, source-aware human review and a reliable
final candidate are still missing; G3–G5 and RELEASE-05 remain open.

The [matched natural-caption model screen](../eval/experiments/2026-09-29-mingfay-natural-model-screen-results.md)
adds partial `CTX-02` and `EVAL-04` evidence: both v5 scene profiles
completed the same 16 exact source cues and durable journals, but 1.8B had
two AI-triaged major fact errors. [REG-018](../eval/regressions/natural-courier-substitution-v1.json)
and [REG-019](../eval/regressions/natural-farewell-invention-v1.json) retain
private exact reproductions and new authored controls in catalog v10. Human
review, source admission, full-file context and model selection remain open.

The [Commons Ying complete-file attempt](../eval/experiments/2026-09-30-commons-ying-full-model-failures.md)
adds partial `DATA-03`, `CTX-02` and `EVAL-04` evidence on a separate 93-cue,
3:38 matched-media candidate. The original Chinese SRT and VP9/Opus video
remain private and hash-pinned. One 7B v5 run stopped after 26 checkpoints
when cue 27 exhausted 256 completion tokens; a copied-state resume reached
93 checkpoints but strict SRT rendering rejected a malformed target, so no
Russian result or speech script was published. [REG-020](../eval/regressions/natural-ying-length-repeat-v1.json)
and [REG-021](../eval/regressions/natural-ying-srt-checkpoint-v1.json)
retain both failures and controls. The SRT checkpoint guard and Windows
socket-test repair passed `task check`; alignment, rights, independent
bilingual review and real listening remain open. The
source does not satisfy the 10–20-minute scene or long-file release tiers.

The [fresh guarded complete-file run](../eval/experiments/2026-09-30-commons-ying-guarded-full-result.md)
then reached 93/93 protected, durable cues and a byte-identical offline result
with the same 7B model, but source-aware **AI triage** found split place/term
facts and a reversed negative contrast. [REG-022](../eval/regressions/natural-ying-boundary-facts-v1.json)
and [REG-023](../eval/regressions/natural-ying-negation-v1.json) retain exact
private reproductions and new controls in catalog v12. The separately
[inventoried Ying candidate](../eval/corpora/commons-ying-candidate-v1.json)
makes six sources and 811 inspected cues, still **zero eligible**. This is
partial `DATA-03`/`CTX-02`/`EVAL-04` structural and failure evidence, not
quality acceptance or a spoken script. Independent bilingual review, source
and audio alignment, rights and longer natural tiers remain open.

`VOICE-02` and `VOICE-07` also have a local Auralis
[SAPI WAV boundary regression](../eval/experiments/2026-09-29-auralis-sapi-wav-boundary.md):
malformed RIFF and incomplete PCM frames are rejected, and two retained real
SAPI WAVs keep their pinned hashes and durations. This is technical parser
evidence on a synthetic script; no human listening, fit acceptance or natural
media pilot is claimed.

`VOICE-01`/`VOICE-02` also have a local Auralis
[managed real-SAPI publication result](../eval/experiments/2026-09-29-auralis-managed-speech-publication.md):
an exact selected-result guard commits both speech artifacts and outbox
messages atomically, verifies their finalized bytes, and hides incomplete or
unselected batches. The first restricted-process voice lookup failed and is
retained; one same-input permitted repair succeeded. This synthetic
two-cue fixture still fails duration fit and has no real reviewer/listener,
production worker, natural source or final-media playback. A1–A6 remain open.

The [natural Ying technical audio result](../eval/experiments/2026-09-30-ying-natural-audio-technical-result.md)
adds partial `VOICE-02`/`VOICE-03` evidence on local Auralis commits
`f91010d`/`6bd5bc5`/`b6991e6`: real SAPI produced three private
beginning/middle/end WAVs from the matched source and a full 3:38 Matroska
decoded and completed an FFplay pass. All three speech durations exceed their
original subtitle windows, and no person has listened or reviewed the script.
This diagnostic does not close `VOICE-01`–`VOICE-04` or A1–A6. The complete
Russian candidate has REG-022/023 meaning errors; only three unapproved cues
were spoken, and no media was published.

The [complete ASUS technical audio diagnostic](../eval/experiments/2026-09-30-asus-full-audio-technical-result.md)
adds local Auralis `VOICE-02`/`VOICE-03` evidence at `12b109d`: one real SAPI
attempt generated 268/268 decodable WAVs for the 14:42 source, but 264 cues
overran their windows and 259 starts overlapped earlier speech. Two retained
mux failures led to full decoded-audio and packet-timeline regressions. The
third private VP9/Opus result decoded fully and completed a full FFplay
process on the same media hash, with no clipped output samples. This remains
an **unreviewed technical draft**: no human heard or rated it, the source
rights/alignment are unadmitted, and no selected-script production publication
or full recovery matrix ran. `VOICE-01`–`VOICE-07` and A1–A6 remain open.

The [read-only ASUS fit screen](../eval/experiments/2026-10-01-asus-audio-fit-feasibility-result.md)
used all 268 retained real SAPI durations without a new TTS or media run.
Only 47 cues mathematically fit at up to 1.5× tempo and 155 at up to 2×;
median required tempo is 1.906× and p95 2.745×. The independently checked
counts make tempo-only adaptation insufficient for this unreviewed script;
they do not establish a listenable speed, approved script or A3/A4 pass.

The [original-platform Vivo real-SAPI technical pilot](../eval/experiments/2026-10-10-vivo-real-sapi-technical-result.md)
adds partial `VOICE-02`/`VOICE-03` evidence on the same 467-cue, 18:36
source in Auralis local `feat/natural-tts-pilot`. One run generated 467/467
real WAVs; one private media assembly decoded fully and one FFplay process
completed. Independent rehash covered all WAVs and output. Yet 465 cue
windows overrun, 464 starts overlap prior speech, only 50/467 could
mathematically fit by 1.5×, and speech lasts 1,258 ms past the picture.
There is no approved script, source/caption rights, human sound rating or
selected-result lineage. A length-scaled beginning/middle/end regression
replaces the fit checker’s former 89/89/rest assumption while old reports
remain immutable. `VOICE-01`–`VOICE-07` and A1–A6 remain open.

The [read-only Vivo grouping screen](../eval/experiments/2026-10-10-vivo-group-fit-result.md)
reused the same 467 real WAVs without resynthesis. Their 38:11.610 total
duration needs 2.057× even across the entire 18:34.363 source-cue interval
with no pauses. At 1.5×, at least 620,178 ms of the retained audio would
need removal before speaker turns or transitions. Grouping alone is rejected
for this draft; a measured silence/voice screen and reviewed script are the
next audio decisions. The prior full-media failure and A3 remain open.

The [467-WAV edge-silence screen](../eval/experiments/2026-10-10-vivo-edge-silence-result.md)
rehashed all retained WAVs at three frozen peak thresholds. Even the broadest
potential edge removal, 432,905 ms, leaves a 187,273-ms ideal 1.5× deficit
before speaker pauses. No audio was actually trimmed or listened to. Edge-only
trimming is rejected for this draft and Irina voice; the bounded alternative
real-voice comparison below followed. A3 stays open.

The [same-text 108-WAV SAPI voice comparison](../eval/experiments/2026-10-10-vivo-sapi-voice-contrast-result.md)
followed that frozen step on 12 exposed Vivo cues, with three repetitions
for each of Irina Desktop, Pavel and Irina. Pavel was shorter on 12/12,
but the paired median duration ratio 0.886 missed the <=0.85 advancement
limit; Irina matched the baseline duration. No alternative advances to
another 467-cue run. No human listening or reviewed script exists, so
`VOICE-02`/`VOICE-03` and A1–A6 remain open. The [v21 RELEASE-05 self-audit](../eval/experiments/2026-10-10-release-05-audit-attempt-v21.md)
retains the source-rights, independent-language, fit and clean-install gaps.

The [Vivo 467-cue copied-state run](../eval/experiments/2026-09-30-commons-vivo-full-7b-resume-result.md)
adds partial `DATA-03`/`CTX-02`/`LONG-04`/`EVAL-04` evidence: a first real 7B
pass stopped at cue 276 with malformed model JSON, kept 275 durable checkpoints
and no partial result; one bounded continuation completed 467/467 strict SRT
cues with byte-identical re-export. The [source-selected AI triage](../eval/experiments/2026-09-30-commons-vivo-source-aware-ai-triage.md)
found five major candidate errors among 62 inspected cues, covering model
generation, planning lead time, team size, clock time and future product claims.
[REG-024–027](../eval/regressions/catalog-v14.json) pin the failure and new
related/negative controls. The v1 review sample's false negation classification
was retained and corrected in v2. These are AI judgments on an unadmitted
source, not a human adequacy score or a selected voice script. Chinese speech,
subtitle alignment, rights and speaker boundaries await human verification;
`LONG-04` remains planned because its prerequisites and three-source review
have not passed.

The [predeclared Vivo 1.8B/7B fact screen](../eval/experiments/2026-09-30-vivo-fact-model-screen-result.md)
adds matched `DATA-03`/`CTX-02`/`EVAL-04`/`DECIDE-01` evidence: five exact
natural windows at two seeds, 18 authored related/negative controls at one
seed, and 56 source-only chat requests. Structural results were 27/28 for
1.8B and 28/28 for 7B. [REG-028](../eval/regressions/natural-vivo-target-slot-neighbor-v1.json)
pins the 1.8B reply that used neighboring cue ID 281 for target 280; the
existing v5 guard rejected it and its provider/CLI tests still pass. AI
triage found repeated 7B source-fact errors on the real windows despite
better authored controls. The new control cases and raw answers are retained,
but no human score, model selection, fine-tuning decision or quantization
precision change follows from this sample. `LONG-04` and release gates remain
open.

The [bounded general fact reminder screen](../eval/experiments/2026-09-30-vivo-general-fact-reminder-result.md)
adds one-factor `CTX-02`/`EVAL-04`/`DECIDE-01` evidence on those same 28 7B
requests. All target slots were structurally valid, but AI source-aware triage
found that the 36-month, team-versus-funds and late-clock errors persisted;
prompt tokens rose 24.1%. The variant was not promoted. The source-aware
quality and independent review dependencies remain open.

The [ASUS 268-cue first full-file diagnostic](../eval/experiments/2026-09-30-commons-asus-full-7b-failure.md)
adds another partial `DATA-03`/`CTX-02`/`LONG-04`/`EVAL-04` result. A first
process launch failed before inference and was retained. The single permitted
7B inference run saved 226 checkpoints, then the model repeated the invented
JSON-tail class at cue 227. The strict SRT guard rejected it, leaving zero
complete results and no partial output. [REG-029](../eval/regressions/natural-asus-json-tail-v1.json)
pins the private three-cue reproducer and new watt/core related and negative
controls on a distinct source. A [copied-state continuation](../eval/experiments/2026-09-30-commons-asus-resume-failure.md)
preserved all 226 blocks and then repeated the same defect on the identical
request with changed Russian wording; it again saved no result. No quality
or source admission claim follows;
`DATA-03`, `CTX-02` and `EVAL-04` remain in progress, and `LONG-04` remains
planned pending complete source-aware human review and its dependencies.

The [one-factor temperature-zero screen](../eval/experiments/2026-09-30-json-tail-temperature-screen-result.md)
adds eight same-source 7B calls on the two failed windows and adjacent
controls. ASUS's invented JSON tail persisted 2/2; Vivo's tail disappeared
2/2, but the 36-month planning fact error remained under AI source-aware
triage. The 6/8 structural total does not justify a lower-temperature
profile, language score, training decision or quantization change.

The [same-source ASUS 1.8B full-file comparison](../eval/experiments/2026-09-30-commons-asus-full-1_8b-failure.md)
adds partial `CTX-02`/`LONG-04`/`EVAL-04`/`DECIDE-01` evidence. The pinned
1.8B v5 profile saved 19/268 checkpoints before returning following-context
ID 21 for target cue 20. The guard withheld the result and SRT. This is a
second natural-source recurrence of the 1.8B neighbor-ID class; [REG-030](../eval/regressions/natural-asus-target-slot-neighbor-v1.json)
retains a minimal private reproduction and six authored related/negative
controls. Both model sizes failed to complete the same ASUS source, at
different cues and for different structural reasons. Neither model or full
release is selected, and `LONG-04` remains planned.

The [bounded natural ASUS slot-schema screen](../eval/experiments/2026-09-30-natural-asus-slot-schema-screen-result.md)
adds partial `CTX-02`/`EVAL-04` evidence on the exact REG-030 request: three
seeded baseline replies repeated neighboring ID 21, while three paired
target-constant-schema replies carried requested ID 20. AI inspection noted
unstable technical nouns; no human language score or complete-file result
exists. The v5 profile is unchanged and schema promotion remains open.

The [one-pass ASUS 1.8B v6 full-file diagnostic](../eval/experiments/2026-09-30-commons-asus-full-v6-slot-result.md)
saved 268/268 checkpoints and a byte-stable review-needed SRT with the
target-constant schema; a source-only frozen 44/268-cue AI review then
found high-confidence physical-unit, product-class, polarity and technical
referent errors. This adds partial `CTX-02`/`LONG-04`/`EVAL-04` evidence,
not accepted language, source rights or a model choice. The new private
raw/accepted review packet and old failed prefixes are retained. Follow-up
measurement/terminology regression controls and independent review remain
open; `LONG-04` is still planned.

[REG-031–033](../eval/regressions/catalog-v18.json) pin 11 ASUS v6
source/accepted error windows and authored related/negative controls.
The [measurement warning contract](reference/measurement-warning-v1.md)
is implemented as a conservative, persisted review diagnostic with core
and SQLite tests; a read-only private audit flagged exactly ASUS cue IDs
12 and 227 within the frozen 44-cue packet. It does not repair the
archived candidate or close
`EVAL-04`, `CTX-02`, `LONG-04` or any release gate. At that point semantic
controls had not been model-run, and human review was absent.

The [paired ASUS v6 fact screen](../eval/experiments/2026-09-30-asus-v6-fact-model-screen-result.md)
adds 64 real requests on the same 11 natural source/context windows and 21
authored controls, with 1.8B and 7B differing only by model alias.
All 64 outer JSON/slot shapes were valid, but two 7B `text` fields contained
leaked JSON-wrapper suffixes, while both sizes retained several product and
technical-term mistakes. The first zero-chat sandbox launch failure is
archived separately; a deterministic startup check now verifies that future
pre-server metadata failures create a durable zero-chat report.
[REG-034](../eval/regressions/catalog-v19.json) now
pins those exact responses and a narrow v5/v6 text rejection guard with
related/negative fixture controls. No post-fix natural full-file run,
human language score or model selection follows; `CTX-02`, `EVAL-04`,
`LONG-04` and release gates remain open.

[REG-035](../eval/regressions/catalog-v20.json) extends the same production
measurement diagnostic with signed and full-width decimal controls after
[two reproduced detector failures](../eval/experiments/2026-10-01-signed-fullwidth-measurement-regression.md).
It catches lost negative signs and previously ignored full-width quantities
while excluding `A-60g` product codes. The archived ASUS output and previous
catalogs are unchanged. This is partial `EVAL-04` fact-warning coverage only;
Chinese numeral phrases, semantic comparisons and independent review remain
open.

The [whole-file read-only ASUS audit](../eval/experiments/2026-10-01-asus-whole-file-measurement-v3-result.md)
checked all 268 archived source/result cue pairs and found six initial
measurement warnings. Two were false positives from uppercase `G` denoting
memory or storage capacity. [REG-036](../eval/regressions/catalog-v21.json)
pins the red cases and related/negative controls; the case-sensitive detector
now leaves four warning IDs: 12, 127, 145 and 227. The archived candidate is
unchanged, and cue 83's distinct storage-capacity mistranslation remains an
AI-identified issue for independent review. This extends partial `EVAL-04`
coverage without satisfying `LONG-04` or G3–G5.

The [REG-037 capacity diagnostic](../eval/experiments/2026-10-01-asus-capacity-warning-result.md)
adds a separately typed, review-only warning for changed numeric memory or
storage capacity. One red minimal case and a Chinese-suffix boundary failure
preceded the fix; eight related and fourteen negative controls now pass, as
does reopened SQLite warning persistence. The one-attempt read-only audit of
all 268 archived ASUS pairs flagged only cue 83. The prior four physical-unit
warning IDs remain separate, the model candidate was not edited, and the
single AI-identified capacity issue is not independent quality adjudication.
`EVAL-04` remains in progress and `LONG-04`/G3–G5 remain open.

The [paired ASUS source-context width screen](../eval/experiments/2026-10-01-asus-context-width-paired-result.md)
adds partial `CTX-02`/`EVAL-04`/`DECIDE-01` evidence on the same eleven
natural development cues: 88 real chats, 176 rendered-token preflights, two
models, two seeds and widths one versus three. Wider context helps one 1.8B
portable-device referent but worsens the battery-life referent/polarity at cue
133; a valid narrow JSON contains an incomplete target at cue 3 and one 7B
narrow response hits its 256-token cap. [REG-038](../eval/regressions/catalog-v23.json)
pins the two new semantic reproductions plus eleven authored related/negative
controls with zero model runs. The wider window is unselected; human review,
source admission, a quality-safe context policy and release gates remain open.

## Current handoff

`CTX-02` and `EVAL-04` now have an opt-in [provider review diagnostic
contract](reference/provider-review-diagnostic-v1.md) and core/SQLite checks.
The new `source_prefix_inserted` flag is validated before checkpoint commit and
again on resume. A separate [development policy](reference/source-prefix-repair-v1.md)
and checked experimental manifest insert only one unambiguous source-prefix
identifier, retaining the raw response and a review flag. [Fixture
acceptance](../eval/experiments/2026-09-29-reg-009-prefix-repair-fixture.md)
and the [bounded 81-request real-model screen](../eval/experiments/2026-09-29-reg-009-live-prefix-repair-results.md)
show 36 raw exact codes, 81 after policy projection and 45 required review flags.
The [CLI/SQLite fixture](../eval/experiments/2026-09-29-reg-009-cli-recovery-fixture.md)
now checks a rejected second cue, no partial result, reopened checkpoint and
journal evidence, resume, and offline byte-identical export.
The one [real 1,024-cue CLI attempt](../eval/experiments/2026-09-29-reg-009-long-cli-soak-results.md)
retained 88/1,024 checkpoints after intentional interruption and resume, then
rejected Cyrillic `АРУ-0089` at cue 89. Zero complete results and no SRT were
published. [REG-014](../eval/regressions/long-v6-cyrillic-code-transposition-v1.json)
adds the real minimal failure and controls; the separate capture correction
keeps an initial summary-field error visible. No full-file quality claim follows.
The screen also retained [REG-012](../eval/regressions/long-v6-first-person-loss-v1.json)
first-person loss and [REG-013](../eval/regressions/long-v6-restart-grammar-v1.json)
Russian fluency failures with related and negative controls. The policy is
not selected for release; REG-009 and human meaning review remain open.
The deterministic [REG-015](../eval/experiments/2026-09-29-reg-015-mixed-script-prefix-repair.md)
reproduction found that v1 can insert an ASCII code before a mixed-script
`АUR-0089` candidate. An exclusive checked v2 manifest now rejects the
lookalike before checkpoint commit, with related/negative controls. V1 and its
real-run evidence remain unchanged; v2 has no real-model or human-quality gate.
The bounded [cue-89 paired decoding screen](../eval/experiments/2026-09-29-reg014-cue89-decoding-results.md)
found raw exact code in 2/3 temperature-0.7 and 3/3 greedy responses on one
synthetic source; one 0.7 answer also lost source-prefix meaning. This does
not select decoding for release. Its new changed-time control confirmed the
existing advisory contract, so a separately versioned
[strict-time v3 policy](reference/strict-source-clock-time-v1.md) now rejects
clock-time differences before checkpoint in fixtures. Full-file completion,
human review and false-positive measurement remain open. [REG-016](../eval/regressions/cue89-omitted-code-and-time-guard-v1.json)
retains the actual omission and new related/negative controls in catalog v8.
The [81-request paired greedy screen](../eval/experiments/2026-09-29-reg009-greedy-81-results.md)
then compared the same 27 beginning/seam/middle/end synthetic cues and three
seeds against the archived temperature-0.7 responses. Raw exact codes stayed
36/81, with six paired gains and six losses; every greedy cue had one unique
output across seeds. [REG-017](../eval/regressions/greedy-restart-grammar-v1.json)
retains a new three-seed cue-510 restart-grammar recurrence and related
same-source controls in catalog v9. Greedy decoding is unselected; human
review and a completed real long file remain required for `CTX-02`, `EVAL-04`
and `LONG-03`.

The next independently executable tasks are `CTX-02`, `DATA-03`, `DATA-04`,
`EVAL-04` and the unfinished `VOICE-01` handoff.
REG-009 now records a durable exact-identifier warning on new runs, while
the 1,024-cue v6 result remains a failed semantic baseline with its original
bytes and checkpoint history. The diagnostic does not close `CTX-02` or
`EVAL-04`. The [matched reminder screen](../eval/experiments/2026-09-29-reg-009-prompt-screen-results.md)
found no code-preservation gain. An [opt-in strict guard](reference/strict-source-identifier-guard-v1.md)
now rejects such candidates before checkpoint commit under a separate checked
profile. This protects output integrity but cannot complete the long file on
the observed 1.8B responses; an effective preservation strategy and human
quality evidence remain open.
The [REG-010 neighbor-content screen](../eval/experiments/2026-09-29-reg-010-neighbor-content.md)
adds a durable clock-time warning and 30 same-source real-model requests.
Both arms kept the target time and code in 15/15; the original cue-129
substitution did not recur, so context removal is unselected. Semantic
isolation and independent long-file review remain open.
An [offline prefix-repair screen](../eval/experiments/2026-09-29-reg-009-prefix-repair-results.md)
on the same archived output improved exact-code coverage from 615 to 1,271 of
1,280 lines, with 9 mismatches and a separate wrong-content cue still open.
The proposal is unselected and has no human adequacy evidence.
The [v2 regression catalog](../eval/experiments/2026-09-29-regression-catalog-v2.md)
now pins all REG-001–009 packs and evidence. Its first audit exposed a missing
REG-008 negative control; the v2 pack and pre-spawn environment check close
that local gap while preserving the v1 evidence. `EVAL-04` remains in progress.
`PLAN-01` has passed planning-artifact and generated-progress checks; publication
is tracked separately in its acceptance record. `PLAN-03` freezes the user-started
Goal in its [scope record](../eval/experiments/2026-09-28-goal-scope-v1.md).
It does not claim implemented v5, training, a voice engine or any release gate. The earlier
`PLAN-02` planning audit remains a separate accepted scope.
`CTX-01` specifies v5, `DATA-01` supplies a checked source inventory, and
`EVAL-01` freezes the review protocol while recording unavailable human review;
`EVAL-02` checks future evidence shape, and `CTX-05` specifies bounded failure
while fixing one structural retry defect. `DATA-02` freezes 60 authored
development context contrasts; `CTX-02` can now implement the source-only v5
profile. Independent language review remains open.

The predeclared [v5 1,024-cue real-model recovery attempt](../eval/experiments/2026-09-29-long-v5-scene-failure.md)
adds partial `CTX-02`/`LONG-01`/`LONG-03` evidence and open `REG-003` under
`EVAL-04`: exact 16-block recovery reached 71/1,024 durable blocks, then the
1.8B model returned context ID 73 for target 72. The raw 269-request journal
and a neighbor-ID regression are retained. Zero result or partial output was
published. The full long-file, quality and resource gates remain incomplete;
the `planned` long-task statuses have not been promoted by this failed soak.

The same-source [v6 target-bound run](../eval/experiments/2026-09-29-long-v6-scene-timeout.md)
passed cue 72's ID control and preserved 964/1,024 checkpoints, then the
runner's hidden 60-minute process limit stopped it inside a declared
120-minute total budget. The 3,619-request journal and `REG-004` budget
reproduction are retained; zero result or partial SRT was published. The
bounded wait policy is fixed and checked, but a new predeclared continuation
and a complete artifact are still required. This is partial `CTX-02`,
`LONG-03` and `EVAL-04` engineering evidence, not translation acceptance.

The first [copied-state continuation](../eval/experiments/2026-09-29-v6-timeout-continuation-v1-failure.md)
failed before inference because its absolute managed-source locator still addressed
the original state directory. `REG-005` retains the exact CLI/server failure logs,
reproduces verified source relocation with altered-copy and unsafe-locator controls,
and leaves both the original timeout and failed copy separate. A [new frozen
relocated-state attempt](../eval/experiments/2026-09-29-v6-timeout-relocated-continuation-plan.md)
is pending; no complete 1,024-cue v6 artifact or language quality gate is claimed.

The [relocated continuation](../eval/experiments/2026-09-29-long-v6-relocated-continuation-failure.md)
subsequently saved 982/1,024 blocks, then the 1.8B v6 model repeated corrupted
JSON/prompt text until its 256-token cap on cue 983. `REG-006` retains the raw
response, 3,688-request journal, source-only controls and zero-result check.
This new model-reliability failure leaves `CTX-02`, `LONG-03`, `EVAL-04` and the
natural-language release gates incomplete. It does not invalidate the prior
timeout or copied-state failures, and no automatic model rerun is authorized by
that experiment's exhausted budget.

The [matched REG-006 screen](../eval/experiments/2026-09-29-reg-006-paired-model-probe-results.md)
adds 16 same-source 1.8B/7B v6 chat observations with pinned models, raw
responses, timing and resource series. Both models passed 8/8 JSON checks in
this small screen; the earlier 1.8B length failure remains. Assistant review
found two 1.8B omissions of explicit `今天`, now retained as `REG-007` with
source-only related and negative controls. The 7B model kept that date in the
two matched observations but used wording needing Russian editorial review.
No model, long-file, human language or audio gate is promoted by this probe.

Deferred UI, optional adaptation/precision and ASR remain visible. A completed
translation CLI milestone does not close the desktop release or audio milestone.
Reclassify a deferred task only when its stated condition or owner scheduling
decision is satisfied. Record a blocked task's prerequisite and proposed next
action here or in its linked task record; waiting for a listed dependency is `planned`.

The [12:56 Mandarin finance source screen](../eval/experiments/2026-10-01-xiaolin-source-inventory-result.md)
adds bounded `DATA-03` evidence without changing its status: the pinned
YouTube extractor advertised no Chinese or automatic caption track. The
Commons video license is unreviewed, and no subtitle rights or cue bytes were
admitted. Its initial sandbox spawn failure is retained and has a process
capture regression check. At that point the nine registered sources remained
at 1,850 inspected and zero eligible cues.

The [30:19 Sunflower Movement source screen](../eval/experiments/2026-10-02-sunflower-source-inventory-result.md)
finds a Commons-reviewed CC BY 3.0 media license but zero original-platform
manual subtitle tracks. Automatically translated Chinese caption listings and
conflicting `ja` source-language metadata cannot establish Chinese source
subtitles or speech alignment. The one metadata response and offline check are
retained; no subtitle/media download or model call was made. `DATA-03` remains
in progress with 12 previously counted candidates, 3,336 inspected cues and
zero eligible cues.

[REG-050](../eval/experiments/2026-10-02-reg-050-source-eligibility-count.md)
corrects the `DATA-01`/`EVAL-04` eligible-cue counter: a mapped
`source_checked` fixture with no human alignment or reference was wrongly
reported as one eligible cue. A failing minimal check and six related/positive
controls now keep unreviewed mapping at zero while counting fully reviewed
states. The twelve real source candidates were already at zero; no release
quality score or existing accepted result changed. `DATA-03` and the human
review gates remain open.

The [12:18 restaurant-video source screen](../eval/experiments/2026-10-01-sethlui-caption-media-mismatch.md)
adds a failed `DATA-03`/`DATA-05` timing admission case: 271 strict Chinese
SRT cues were acquired at a pinned Commons revision, but eight end beyond a
conservative upper bound for the listed media duration. `REG-039` and a
reusable cue/media-duration check retain the exact mismatch and boundary
controls. The original SRT is preserved privately, no matched scene is
admitted, and at that point the existing nine-candidate, 1,850-cue denominator
was unchanged.

The [measured restaurant stream and mapped derivative](../eval/experiments/2026-10-01-sethlui-stream-derivative-result.md)
add another technical `DATA-03` candidate. The actual 426x240 VP9/Opus stream
lasts 738,056 ms. Cues 1–263 end within it; cues 264–271 are outside it and
remain in the immutable original only. The private 263-cue derivative passed
strict CLI, source-prefix, hash, mapping and media-duration checks. The
original 271-cue source remains rejected as a complete scene under `REG-039`.
Three [cue-linked source-audio windows](../eval/experiments/2026-10-01-sethlui-audio-windows-result.md)
from the beginning, middle and end decoded to PCM and passed hash/overlap
checks; no human has listened to or aligned them.
Across ten registered candidates there are now **2,113 inspected and zero
eligible cues**. Caption/audio rights, speech alignment, reference and human
review are still unresolved; no model result or audio quality gate is claimed.

The [frozen same-source restaurant model screen](../eval/experiments/2026-10-01-sethlui-full-v6-model-comparison-result.md)
adds partial `CTX-02`, `LONG-04`, `EVAL-04` and `DECIDE-01` evidence. With the
same first 61 prompts, 1.8B completed a separate 263-cue structural SRT but
its unreviewed Russian text omitted a name, swapped food categories and
substituted a neighboring cue. The 7B arm stopped at cue 62 on the previously
observed JSON-tail family: 61 durable checkpoints, zero complete result and no
partial SRT. `REG-040` and `REG-041` pin the exact private reproducers and
authored controls; the existing SRT guard rejects the invalid line. A failed
harness path also omitted run ID and elapsed time from its report, so future
runs now capture both fields without changing the archived failure. Neither
model is selected; no human translation or listening score, rights clearance,
speech alignment, training/precision decision or release gate follows.

The [one-attempt copied 7B continuation](../eval/experiments/2026-10-01-sethlui-7b-copy-resume-failure.md)
adds partial `LONG-03`, `LONG-04`, `CTX-02` and `EVAL-04` recovery evidence.
The original 61 checkpoints and original SQLite/SHM/WAL remain unchanged.
The copied run passed its prior cue-62 failure and saved 99/263 blocks, but
the same invalid JSON-tail family recurred at cue 100; `REG-042` pins the
raw request, rejected target, related/negative controls and no-result state.
Its single continuation attempt is exhausted. This failure does not select
7B, make 1.8B's known meaning errors acceptable, or establish any human
translation/audio gate. The [latest interim release audit](../eval/experiments/2026-10-01-release-readiness-after-sethlui-resume.md)
keeps G1–G9/A1–A6 and final `RELEASE-05` open.

The [direct YouTube original-track comparison](../eval/experiments/2026-10-01-sethlui-youtube-caption-result.md)
confirms that its 271 cues equal the Commons import except for two final LF
bytes. All eight out-of-media cues were already in the original track. The
current video metadata reports a CC Attribution license claim, but caption
authorship/rights, speech alignment and independent review remain open; the
ten-candidate, 2,113 inspected, zero eligible denominator does not change.
The [CLI provenance correction](../eval/experiments/2026-10-01-sethlui-cli-provenance-audit.md)
separates historical SRT-grammar rejections from the newer provider guard.
Exact failed suffixes are now covered by current-source tests; the rebuilt
CLI has not been run on the natural file. The [latest interim audit](../eval/experiments/2026-10-01-release-readiness-after-original-track.md)
retains G1–G9/A1–A6 as open.

The [CC BY 4.0 Paywall long-source acquisition](../eval/experiments/2026-10-01-paywall-licensed-long-source-result.md)
adds a distinct 880-cue Traditional Chinese strict-SRT technical candidate,
an exact 294,354,909-byte matching documentary OGV and three cue-linked
beginning/middle/end source-audio windows. Subtitle and film/audio license
claims have creator and attribution evidence, but the English-spoken source
still needs scene exclusions, speech/cue alignment and independent Chinese–
Russian references/review. The inventory now holds **11 candidates, 2,993
inspected cues and zero eligible cues**; `DATA-03` and `DATA-05` remain open.
The source-inventory validator now permits source rights to be checked before
scene admission while preserving the zero-eligible invariant. No Paywall
source bytes or WAVs are published. The [new interim release audit](../eval/experiments/2026-10-01-release-readiness-after-paywall-source.md)
retains all release and audio gates as open.

The [bounded 7B retry screens](../eval/experiments/2026-10-01-sethlui-json-tail-length-retry-result.md)
add partial `CTX-02`, `CTX-05`, `LONG-04` and `EVAL-04` evidence on the
same 263-cue restaurant source. The first new run still stopped at cue 62
after 61 durable blocks: `finish_reason=length` and 256 repeated wrapper
closers were outside the initial completed-response retry rule. `REG-043`
pins that exact raw failure, three related and four negative contract cases.
The separately versioned v2 policy passed provider/core tests and one real
full-file screen: 264 chats, one rejected cue-62 answer followed by a clean
identical-request answer, 263 checkpoints, one structurally valid SRT and a
byte-identical offline export. This run exercised the completed-response
retry rule; the new length-specific branch has no real-model retry outcome.
The retained first failed run and original/copy states were not changed.
AI source-aware triage found better name/quantity retention than the 1.8B
draft at selected cues, but a dim sum role is still mislabeled and the same
venue name has three Russian renderings (`REG-044`). With zero eligible corpus
cues, no independent bilingual ratings, source-rights clearance or listening,
this is not a selected model, approved spoken script or G1–G9/A1–A6 pass.
The [restaurant real-SAPI and full-media result](../eval/experiments/2026-10-01-sethlui-real-audio-technical-result.md)
adds partial `VOICE-02`/`VOICE-03`/`VOICE-06` evidence at local Auralis
`f4e1c1d`: 263/263 independently decoded real WAVs, one 738,056-ms private
audio track with complete video coverage, and one full FFplay process. The
frozen check measured 256 cue overruns and 236 overlapping starts; no human
listened or approved the draft. A bounded [read-only fit screen](../eval/experiments/2026-10-01-sethlui-audio-fit-feasibility-result.md)
at local Auralis `2ce8be5` found that only 158/263 cues could mathematically
fit with a 75-ms margin even at a hypothetical 2× speech tempo. The
[redacted public summary](../eval/reports/2026-10-01-sethlui-real-audio-summary.json)
pins the source, runtime, media and playback hashes. `VOICE-01`–`VOICE-07` and
A1–A6 remain open. The [latest interim failed readiness audit](../eval/experiments/2026-10-01-release-readiness-after-sethlui-audio.md)
keeps `RELEASE-05` open after the prior
[translation-only self-audit](../eval/experiments/2026-10-01-release-readiness-after-sethlui-retry.md).
The [private source/dub audition packet](../eval/experiments/2026-10-01-sethlui-private-audition-packet-result.md)
adds partial `VOICE-04` preparation at local Auralis `10427b8`: six
predeclared windows, 49 distinct cues, 12 decoded paired Opus clips and a
blank reviewer form. No person listened or scored the audio, and no source
speech alignment or rights decision was made. It cannot complete A4/A6 or
the [latest failed RELEASE-05 audit](../eval/experiments/2026-10-01-release-05-audit-attempt-v2.md).

The [v5 approved-term diagnostic](../eval/experiments/2026-10-01-v5-approved-term-diagnostic.md)
adds partial `CTX-02`/`EVAL-04` implementation evidence at `c13c260`.
`REG-045` pins the previously silent missing-form case with related and
negative authored controls. Newly accepted checkpoints retain an advisory
without rewriting model output; old diagnostics and the natural `REG-044`
restaurant result remain unchanged. No reviewer-approved venue spelling,
real-model comparison or release gate follows from these fixture checks.

The [read-only whole-result term audit](../eval/experiments/2026-10-02-v5-whole-result-term-audit.md)
adds another partial `CTX-02`/`EVAL-04` control. It checks an exported SRT
against the immutable source, scene map and term ledger, including a 1,024-cue
authored boundary ladder. It can inspect old result bytes without rewriting
their checkpoints. The natural restaurant draft still lacks an independently
approved term ledger and bilingual review, so `REG-044` and G3–G5 remain open.

The [third committed-candidate RELEASE-05 self-audit](../eval/experiments/2026-10-02-release-05-audit-attempt-v3.md)
examined the published `82b824f` Translate tree after the whole-result
diagnostic. Pages and affected engineering checks passed. No independent
translation or listening review, admitted source, fitted audio or clean
installation was added. `RELEASE-05` remains planned and the Goal remains
incomplete.

The [REG-046 term-pair audit correction](../eval/experiments/2026-10-02-reg-046-term-pair-audit.md)
adds partial `CTX-02`/`EVAL-04` contract evidence. The prior whole-result
report counted each applicable source-line/ledger-term pair but emitted only
one line warning when two approved forms were omitted in the same cue.
Report schema 2 counts each missing pair and identifies its zero-based ledger
term index. The authored reproducer, related and negative controls are pinned
in [catalog v30](../eval/regressions/catalog-v30.json), while earlier catalog
and report bytes remain historical. This changes no accepted translation,
has no model or human quality rating and does not close G5 or `RELEASE-05`.

The [translation quality critical path](../eval/experiments/2026-10-02-translation-depth-plan-v1.md)
prioritizes `DATA-03` rights and speech alignment, then blinded same-source
meaning/terminology review, token/seam/recovery controls and an evidence-based
model decision. It freezes one bounded Kirin metadata probe before network
access; zero eligible cues and zero independent reviewers remain the present
state. This is an execution priority within PLAN-03, not a lowered gate or a
new model result.

The owner requested a current-state landing page and separate historical HTML.
The [versioned public layout](reference/public-report-layout-v2.md) gives
`EVAL-03` partial presentation evidence: current claims and next actions appear
at `site/index.html`, while the prior detailed evidence and failures remain at
`site/history.html`. The [split verification record](../eval/experiments/2026-10-02-public-report-split-result.md)
tracks the generated boundary and publication check. It does not complete
`EVAL-03` or any release gate.

The owner has no available bilingual reviewer or listener and requested a
zero-budget route. The [opt-in acquisition plan](../eval/experiments/2026-10-02-no-budget-human-review-route-v1.md)
separates bilingual source-meaning review from Russian TTS listening, records
free language-exchange channels and a small rights-safe development packet,
then retains the existing sealed 300-cue and audio gates. No person has agreed
to participate; no human score or release threshold changes.

The [bounded volunteer lead screen](../eval/experiments/2026-10-02-free-reviewer-lead-screen.md)
found one public profile offering free indie localization with Russian and
Chinese background. Its Chinese→Russian proficiency and willingness to
review this commercial project are unverified. The owner then declined
volunteer outreach; the invitation was not sent and the lead remains historical
research. Human reviewer and listener coverage remain zero; independent
engineering work continues without relabeling AI assessments as human scores.

The [retained restaurant source-audio activity screen](../eval/experiments/2026-10-02-sethlui-source-activity-result.md)
adds a bounded `DATA-03`/`VOICE-07` negative result. Local Auralis
`1758a47`/`9e25b64` pinned the Chinese SRT, source media and FFmpeg version,
checked silence/cue boundary controls and recomputed one raw run. Only 155 of
598,432 cue-window milliseconds overlapped detected silence; zero of 263
cues were almost quiet. Continuous sound is not evidence of Chinese speech,
so the screen is uninformative for alignment and adds zero eligible cues.
Human speech alignment, rights and listening remain open.

The [licensed Paywall Chinese-text paired screen](../eval/experiments/2026-10-02-paywall-bilingual-review-seed-results.md)
adds partial `CTX-02`/`EVAL-04` development evidence without changing DATA-03
admission: identical v5 source-only prompts for 1.8B and 7B on 12 original
beginning/middle/end cues, 16 text slots per arm, 16 raw chats and 32 durable
preflights each, with byte-identical offline exports. The 1.8B cue 861 omits
Elsevier and repeats following-cue content; both cue-17 outputs use an
ambiguous Russian comma-grouped amount. [REG-047–049](../eval/regressions/catalog-v31.json)
retain those reproductions and the corrected multiline request-budget check.
The original 12-call-plus-four-retry assumption was wrong: all 16 allowed
chats covered source lines with zero retries. This source's film speech is
English, reference rights and human ratings are absent, and no model or
spoken script is selected. G3–G5, A1–A6 and RELEASE-05 remain open.

A [private consent-first Paywall volunteer packet](../eval/experiments/2026-10-02-paywall-volunteer-review-packet.md)
now binds the same 12 source cues to two counterbalanced opaque candidates
each, with an immutable sealed model mapping and 24 blank judgment fields.
`task eval:review:paywall:packet:check` verifies the original source and both
candidate reports; receipt SHA-256 is
`0cf8d030aedc80d8c7a460e03471f143f81f31243ea7c75711915faedc5e5cf0`.
No invitation, consent, human review, or source admission is implied by packet
creation. The owner declined volunteer outreach; this packet is retained but
the acquisition route is inactive under the current decision.

The [bounded v7 context-salience diagnostic](../eval/experiments/2026-10-02-v7-context-salience-result.md)
adds partial `LONG-01`/`EVAL-04` evidence to `REG-051`. On the same authored
cue, model, runtime, prompt and two paired seeds, the 1.8B model twice
substituted the neighboring ticket price when that cue was supplied as
source-only context. It twice retained Wang and the not-Friday meaning when
the context was empty, although Russian grammar was rough. Order was
counterbalanced; four raw chats, eight token/template preflights and the
sandbox process failure are retained. The [evidence check](../eval/scripts/check-v7-context-salience.mjs)
pins those pairs. This is a local diagnosis, not general proof that dropping
context is safe. The v7 currency guard blocks the observed money leak, but
other semantic substitutions remain possible. Next, freeze and compare a
target-first prompt with context retained; only then resume batch/seam trials
on natural eligible sources. No human rating, long-file pass, G3–G5 or
A1–A6 acceptance is added.

The [12-response target-first order screen](../eval/experiments/2026-10-02-v7-target-first-order-result.md)
adds partial `LONG-01`/`EVAL-04` evidence on three authored Chinese pairs,
two seeds and counterbalanced request order. With identical source-only
context and decoding, the baseline copied ticket money under Wang's ID in
both seeds; target-first JSON order retained the Wang/Friday meaning in both.
Two unseen development pairs retained target sense in both orders, with a
rain-tense variation. This justifies only the distinct opt-in v8 prompt
identity, not general semantic reliability.

The [real v8 CLI one/four-target screen](../eval/experiments/2026-10-02-v8-authored-cli-result.md)
adds partial `LONG-01`/`EVAL-04` and initial `LONG-02` development evidence:
both batches produced full four-cue SRT files, kept the source hash and
journaled 4/1 validated requests with 4/1 checkpoints. The one-target arm
used 1,104/178 input/output tokens in 9,938 ms CLI time; the four-target arm
used 467/158 in 7,880 ms. This is a single ordered run with shared prompt
cache, not a repeatable speed estimate. Both results need review. Cue 3's
name varies and the four-target Russian question is ungrammatical by AI
triage; [REG-052](../eval/regressions/catalog-v34.json) retains exact raw
evidence and six authored controls. No human review,
natural long-file pass, approved spoken script or G3–G9/A1–A6 acceptance is
added. A subsequent bounded model screen and its newly exposed error are
recorded below.

The [REG-052 v8 control screen](../eval/experiments/2026-10-02-reg-052-v8-controls-result.md)
ran all six frozen name/question cases with and without the original
source-only neighbors at seeds 101 and 202: 24/24 structurally valid real
responses and 48/48 template/tokenizer preflights. AI review found unstable
renderings of 小李, shortened names, and one clear context-induced payment
verb for a document hand-over target. [REG-053](../eval/regressions/catalog-v35.json)
retains that exact raw pair and six new related/negative controls, presently
unrun. The fixed neighbors form an adversarial authored stress rather than
a natural scene. V8 therefore remains experimental; model comparison,
source-scoped approved names, natural seams and independent meaning review
are still required before an approved script or G3–G9/A1–A6 claim.

The [same-prompt 1.8B/7B REG-052 screen](../eval/experiments/2026-10-02-reg-052-cross-model-result.md)
adds twelve real paired context-on responses on the same six known authored
controls and two seeds. The 7B output did not repeat the payment-verb
intrusion and kept Xiao Li in the cases where 1.8B varied or shortened the
name, but Wang's spelling and one Russian case still vary. This is an AI
assessment on known development sources, with zero human ratings. The
7B used 3,240/452 prompt/completion tokens against the 1.8B's
3,284/473, in separate server runs; it is neither a speed benchmark nor
evidence for natural-file quality. A checked 7B v8 manifest, bounded CLI
source comparison, source-scoped approved names and natural seam study are
next, while the release gate remains open.

The [real 7B v8 four-cue CLI screen](../eval/experiments/2026-10-02-v8-7b-authored-cli-result.md)
adds an opt-in checked 7B manifest and a fresh durable result on the same
authored Chinese SRT as the prior 1.8B v8 batch-four arm. One real chat,
two token preflights, one validated checkpoint and one full `needs_review`
SRT preserved source bytes and the protected amounts. AI review found a
grammatical Xiao Li question where 1.8B failed; both model outputs remain
unreviewed by a Chinese–Russian person. The 7B CLI took 29,900 ms in this
one run and reached 7,212 MiB device-wide GPU use on an 8 GiB card; no
portable speed or headroom claim follows. Natural long-file translation,
scene seams, human meaning review and spoken-script approval remain open.

The [matched natural 268-cue v8 screen](../eval/experiments/2026-10-02-v8-asus-natural-long-result.md)
adds partial `LONG-01`/`LONG-02`/`EVAL-04` evidence on the same private
Chinese SRT for 1.8B and 7B. Four-target batches used checked rendered-token
preflights and separate durable SQLite states. The 1.8B run retained 216 cues
before malformed inner text at cue 217; the 7B run retained 140 before a
leaked JSON fragment at cue 141. Neither produced a result SRT. The 7B
provider journal incorrectly called the final request `validated_batch`,
although the SRT guard rejected it before checkpoint. A new provider guard
rejects leaked JSON structure before that journal status; the document
validator remains a second boundary. [REG-054/055](../eval/regressions/catalog-v36.json)
pin both private raw hashes and twelve unrun related/negative controls.
These are retained development failures, not a completed long-file quality
comparison or release gate. Next: one predeclared bounded recovery attempt,
then explicit beginning/middle/end, seam, name, number, negation and scene
review on any full output; source rights, human review and real audio remain
independent requirements.

The [copy-only v8 recovery](../eval/experiments/2026-10-02-v8-asus-copy-resume-result.md)
adds partial `LONG-01`/`LONG-02`/`EVAL-04` durability evidence: the
original states stayed byte-identical while 1.8B advanced from 216 to
244 cues, then rejected another malformed target; 7B hit a 1,024-token
completion length cap on cue 141 and remained at 140 cues. The earlier
zero-model `spawn EPERM` is retained. [REG-056/057](../eval/regressions/catalog-v37.json)
pin both new model failures and related controls. No four-target SRT was
published.

The [fresh one-target v8 comparison](../eval/experiments/2026-10-02-v8-asus-single-target-result.md)
adds partial `LONG-01`/`LONG-02`/`LONG-04`/`EVAL-04` evidence on the
same 268-cue natural development file: 7B produced 268 checked
checkpoints and a separate `needs_review` SRT; 1.8B stopped at cue 80
after a repeated multi-line target and kept 79 checkpoints with no
result. Both ran within the declared request/time budgets, but only 7B
completed and the source still lacks rights/alignment admission. The
[43-cue source-only-selected AI audit](../eval/experiments/2026-10-02-v8-asus-single-target-risk-audit-result.md)
found six high-confidence semantic/term problems and four Russian
language problems in the complete 7B draft. [REG-058/059](../eval/regressions/catalog-v38.json)
retain the six private paired reproductions, the 1.8B repeated-line
failure and eighteen authored controls, all with zero human ratings.
The deterministic warning scan also produced false positives for
locale-formatted or spelled numbers and translated units; it is not a
quality score. The [REG-058 paired real-model controls](../eval/experiments/2026-10-02-reg-058-paired-controls-result.md)
ran after retaining an invalid first harness: it changed only one of two
target fields. [REG-060](../eval/regressions/catalog-v39.json) pins that
error and four controls. The corrected v2 screen used 24 exact authored
targets with real 1.8B/7B responses and token preflights. AI reading found
further multi-core, mouse-pad and platform-action failures in 7B;
one response leaked a JSON tail. These are development observations, not
an independent adequacy score. The [frozen 7B prompt comparison](../eval/experiments/2026-10-02-reg-058-semantic-instruction-v1-result.md)
added six unseen related controls and completed 18 matched baseline/instruction
pairs after retaining a zero-request sandbox launch failure. Both variants
left the measured multi-core and mouse-pad positives wrong. The generic
instruction is rejected without changing v8 or spending a full-file run;
the raw failed and successful attempts remain pinned. The
[manufacturer-sourced provisional term screen](../eval/experiments/2026-10-02-reg-058-provisional-terms-v1-result.md)
then ran ten paired 7B controls (20 real answers, 40 tokenizer preflights).
Both positive terms improved, but the term arm changed two correct known
negatives into wrong processor-count and mouse-accessory claims. Its frozen
advancement rule failed, v8 remains unchanged, and
[REG-061](../eval/regressions/catalog-v40.json) pins two minimal reproductions
plus five unrun related/negative cases. Next: design target-scoped term
isolation and test the unrun cases before considering another long-file run;
no prompt search or production admission has occurred. Real scene seams,
independent bilingual review, an approved spoken script and Auralis
listening remain separate work. `LONG-04`, G3–G9 and A1–A6 remain open.

The [RELEASE-05 v6 self-audit](../eval/experiments/2026-10-02-release-05-audit-attempt-v6.md)
checks committed candidate `bb4b908` and the byte-identical published
current and historical Pages. The 7B draft has complete structure but
no admitted source, independent meaning review, approved term score,
selected-hardware SLA, same-candidate fault matrix, clean installation
or approved/listened Auralis media. Its six AI-identified meaning risks
are unresolved. `RELEASE-05` and all required G3–G9/A1–A6 gates stay
open; no CLI result closes the deferred desktop slice.

The [RELEASE-05 v8 self-audit](../eval/experiments/2026-10-02-release-05-audit-attempt-v8.md)
audits committed candidate `33186ea` and the new source-inventory evidence;
publication of its current and historical Pages remains a separate check.
The corrected REG-058 control screen and new 37-cue source candidate do not
supply independent language or listening ratings. G3–G9 and A1–A6 remain
open, as do source admission, the approved spoken script, clean installation
and the deferred desktop decision. The [v7 audit](../eval/experiments/2026-10-02-release-05-audit-attempt-v7.md)
and failed harness are retained.

The [RELEASE-05 v9 self-audit](../eval/experiments/2026-10-02-release-05-audit-attempt-v9.md)
checks committed candidate `b8985d4`, the rejected one-factor REG-058 prompt
screen, current source eligibility, the full regression task and the deployed
current/history pages. All required G3–G9 and A1–A6 gates remain open;
the [v10 self-audit](../eval/experiments/2026-10-03-release-05-audit-attempt-v10.md)
adds the rejected manufacturer term screen and REG-061 without changing those
gate decisions.

G1–G2 retain partial development evidence only. The 7B v8 product profile
and Auralis checkout were not modified by the rejected experiment.

## REG-061 target-only development outcome

The [frozen fifteen-case screen](../eval/experiments/2026-10-03-reg-061-target-terms-v1-result.md) closes only EVAL-05. Target absence, negation and naming mentions retain exact v8 request bytes, with explicit needs_review where applicable. Both original positives and negatives improve/persist, but the candidate fails its advancement rule: a new availability contrast replaces the stand with a hybrid pad-stand, and two negative mentions remain unclear. [Catalog v41](../eval/regressions/catalog-v41.json) retains REG-061 follow-up and REG-062. The experimental transformer stays outside product profiles; no 268-cue inference was run. CTX-03/EVAL-04, independent review, RELEASE-05 and audio gates remain open. Next is contrast-referent admission and reviewed terminology, not another undeclared prompt search.

## REG-062 exact-occurrence development outcome

The [TERM-02 bounded screen](../eval/experiments/2026-10-03-reg-062-occurrence-terms-v1-result.md) tested one source-span candidate against the same v8 requests on 20 exposed authored cues, three paired runs each. Twelve positive concept errors in v8 became zero, but the available stand was replaced by a second pad in all three concrete REG-062 repetitions; the distinct-speaker control also lost the stand three times. The frozen no-new-major-error rule rejected the candidate. [Catalog v43](../eval/regressions/catalog-v43.json) retains all three formerly unrun controls and the repeated failure. TERM-02 closes only this bounded experiment; no product profile, full-file run, independent meaning review, G5 or RELEASE-05 follows from it. The approved-term and natural-scene work under CTX-03/EVAL-04 remains open.

## NAME-02 admission-only outcome

The [offline NAME-02 replay](../eval/experiments/2026-10-03-name-action-admission-v1-result.md)
traces all nine newly broken NAME-01 observations to their exact source, context,
request, raw response and accepted checkpoint. A guarded experimental profile
rejects every active name proposal before checkpoint while retaining raw evidence;
33/33 historical proposal replies are contained. Twenty deterministic controls
exercise target isolation, actions and names without new model calls. Correct
named replies are also rejected, so this is a safety barrier, not a translation
quality improvement. [Catalog v44](../eval/regressions/catalog-v44.json) combines
this rejection with TERM-02's earlier catalog v43 without rewriting either
previous catalog. Product v8 remains the usable baseline; human language review,
natural long-file quality, G3-G5 and RELEASE-05 remain open.
The next bounded `EVAL-04`/`CTX-03` source-fact screen and independent `DATA-03`
natural-source admission are specified in the
[execution prompts](GOAL_FIX_PROMPTS.md#next-executable-assignments-after-both-rejections).

## 9 October original Vivo long-file and REG-065 recovery

The [frozen original-platform comparison](../eval/experiments/2026-10-09-vivo-original-v8-long-result.md)
uses one matched 467-cue Chinese SRT and video. V8/7B generated one complete
`needs_review` SRT; v8/1.8B stopped safely after 112 cues on terminal line
breaks in four target fields. [REG-065](../eval/regressions/reg-065-vivo-v8-terminal-line-break-v1.json)
retains that exact raw failure and nine related/negative controls. The narrow
provider normalization and [single copy-only recovery](../eval/experiments/2026-10-09-vivo-reg065-copy-recovery-result.md)
produced a 467/467-cue 1.8B SRT with 117 durable batches and the original
failed state unchanged. The fresh model reply at the old failure point lacked
the line break, so only deterministic controls isolate the parser fix.

These records add partial `CTX-02`, `LONG-01/02/04` and `EVAL-04` evidence.
`LONG-04` remains planned: this is one copy, one source and no independent
language or speaker review. AI source-aware triage finds recurrent fact errors
in both complete drafts; neither is promoted. [REG-066 and catalog v46](../eval/regressions/catalog-v46.json)
pin five paired request/response reproducers plus five related and five
negative authored controls for the next bounded model screen; those controls
have not yet been run. `DATA-03`, `CTX-03`, `DECIDE-01`,
G3–G5, voice acceptance and `RELEASE-05` remain open. The next bounded task is
a same-source fact-preservation screen with fresh related and negative
controls, followed by an independently reviewed full candidate if a reviewer
becomes available. The owner has ruled out volunteer outreach.
The [RELEASE-05 v11 interim self-audit](../eval/experiments/2026-10-09-release-05-audit-attempt-v11.md)
records all G1–G9 and A1–A6 decisions as partial or open; it does not certify
a final candidate.

## REG-066 authored fact-control screen

The [frozen 20-request 1.8B/7B v8 screen](../eval/experiments/2026-10-09-reg066-authored-v8-screen-result.md)
ran all five related and five negative authored controls without Russian
references in prompts. All 20 chats and 40 template/tokenizer preflights were
structurally valid. Separate AI review marked eight focus facts preserved and
two `needs_review` for each model; it noted five awkward 1.8B and two awkward
7B Russian outputs. There are zero independent bilingual ratings. [Catalog
v47](../eval/regressions/catalog-v47.json) retains exact request/response
identities, prior v46 and this observed control outcome. The short controls
do not fix the five paired natural-file risks, so `CTX-03`, `EVAL-04`,
`DECIDE-01`, G3–G5 and RELEASE-05 remain open. Next is a bounded same-source
cue-fragment/scene-boundary comparison; a source-derived fact guard may be
tested only with the negative controls and a no-new-major-error rule.
The [RELEASE-05 v12 self-audit](../eval/experiments/2026-10-09-release-05-audit-attempt-v12.md)
keeps every release and audio gate open after this short-control result.

## REG-066 natural cue-seam comparison

The [frozen same-source 30-chat screen](../eval/experiments/2026-10-09-reg066-natural-seams-result.md)
compared original versus shifted four-cue target windows around all five
natural fact risks, with five unchanged negative controls on each v8 model.
All 60 template/tokenizer preflights passed, 28 replies were structurally
valid, and both shifted final batches omitted cue 467. A source-aware AI
review found one 7B time repair at cue 328, but the 36-month relation,
thousand-person team and future-product modality remained wrong or unclear;
1.8B introduced a French word at cue 60. [REG-067/068 in catalog
v48](../eval/regressions/catalog-v48.json) retain exact reproductions, two
new related and two contrast controls per failure; authored follow-ups are
pending. The blanket shift is rejected and v8 unchanged. `CTX-03`,
`EVAL-04`, `DECIDE-01`, human source/translation review, G3–G5 and
RELEASE-05 remain open. The [v13 self-audit](../eval/experiments/2026-10-09-release-05-audit-attempt-v13.md)
records the unchanged audio and installation gates. Next experiment may
test only source-derived typed facts with a frozen no-new-major-error rule.

## Source-derived fact-hint screen

The [predeclared 36-chat 7B comparison](../eval/experiments/2026-10-09-source-fact-hints-v1-result.md)
tested the unchanged v8 request against target-scoped Chinese fact hints on
five natural fact windows, old negative cases and REG-067/068 controls.
All 72 template/tokenizer preflights passed; five no-hint candidate requests
were byte-identical to v8. One authored 9400 control improved, but natural
cue 328 changed a correct after-midnight 01:00–02:00 into 11:00–12:00 at
night, while cue 276 added JSON wrapper fragments to target strings. The
existing provider rejects the latter before checkpoint; exact syntax tests
passed under v7 and v8. The earlier 36-month and team errors remain.
[REG-069/070 and catalog v49](../eval/regressions/catalog-v49.json) retain
the failed raw identities, deterministic containment and new related and
negative controls. The candidate is rejected, the extractor remains in
`eval/`, and product v8 and both long-file drafts are unchanged. This
adds partial `EVAL-04`/`CTX-03` development evidence without completing
either task or advancing `DECIDE-01`, G3–G5 or `LONG-04`. The
[v14 RELEASE-05 self-audit](../eval/experiments/2026-10-09-release-05-audit-attempt-v14.md)
keeps all final language, installation and audio gates open. Next investigate
source-derived post-answer warnings or fail-closed review with a new bounded
screen; do not repeat prompt-hint tuning against the same known controls as
though they were an independent holdout.

## Source clock review after model output

The [frozen offline replay](../eval/experiments/2026-10-09-source-clock-review-v1-result.md)
adds one evaluation-only source-derived warning for `REG-070`. It rehashed
the unchanged 467-cue source and v8 draft plus the prior 36-chat journal,
with zero new model calls. The rule recognized only cue 328 in the full
file and flagged its wrong late-evening rendering; it also flagged the
rejected hint candidate while abstaining on the prior correct-hour
baseline. Related and negative authored controls passed. This is partial
`EVAL-04` evidence, not a product policy or a measure of overall quality:
the known 36-month, team and future-modality errors remain outside its
scope. A second source family, measured false positives, approved terms,
human review and all final language/audio gates remain open. The
[v15 self-audit](../eval/experiments/2026-10-09-release-05-audit-attempt-v15.md)
retains the rejection of `RELEASE-05`.

## Source relation review after model output

The [frozen offline replay](../eval/experiments/2026-10-10-source-relation-review-v1-result.md)
rehashes the 467-cue original Chinese SRT, complete v8/7B draft and 36-chat
prior journal. Three source-derived relations were recognized and all three
known draft errors at cues 276, 280 and 466 received evaluation-only review
warnings. Five of six saved paired answers were warned; the unflagged cue-466
candidate still has uncertain agency under AI review. Four deterministic
control groups passed after a recorded fixture/rule correction. The other
464 cues were outside this narrow rule; zero new model calls and zero human
ratings do not advance translation quality. Product v8, prior results and
original media remain unchanged. `EVAL-04`, `CTX-03`, `LONG-04`, G3–G5,
`VOICE-01` and `RELEASE-05` remain open. A separately sourced precision
check and independently approved script precede any product gate.

## Focus-slot 7B screen and REG-071 follow-up

The [frozen 20-chat same-source comparison](../eval/experiments/2026-10-10-vivo-focus-slot-v1-result.md)
used ten exposed Vivo/REG-066 cases, one seed, 40 template/tokenizer
preflights and 9,606 combined tokens. All replies were structurally valid,
but narrowing a four/three-slot target batch to the risky cue repaired
**zero of three** primary 36-month/team/future-product relation errors.
One after-midnight hour improved while its Russian phrase became
ungrammatical; five authored contrast facts remained. The predeclared
shortlist rule rejected the candidate, so v8 and both full SRTs remain
unchanged. The shorthand present-product answer also exposed a false
negative in the evaluation-only v1 relation warning. [REG-071 and catalog
v50](../eval/regressions/catalog-v50.json) retain the raw hashes, minimal
reproducer and five new related/negative controls. The
[v2 offline replay](../eval/experiments/2026-10-10-source-relation-review-v2-result.md)
warns on that new reply while preserving the same three warnings in the
full 467-cue draft; it makes no product change and has no second-source
precision or human ratings. `CTX-03`, `LONG-02/04`, `EVAL-04`, `DECIDE-01`,
G3–G5, `VOICE-01` and `RELEASE-05` remain open. Next compare a different
quality strategy against the retained v8 baseline, with new controls and
bounded attempts; another batch-boundary tweak is not justified by this
screen.

The [frozen cross-source v2 warning screen](../eval/experiments/2026-10-10-source-relation-cross-source-result.md)
rehashes the distinct ASUS and Sethlui Chinese source groups and three
retained Russian drafts. All 794 source/target cue pairs aligned, but the
rule recognized zero source relations among 531 unique Chinese cues, so
it emitted zero warnings. This **does not measure precision** or validate
the warning outside its exposed Vivo cases. The rule remains in `eval/`;
v8 and all drafts remain unchanged. Before product admission, `EVAL-04`
needs another source-derived fact relation with related negatives,
measured trigger coverage and source-aware assessment of every warning.
The [v22 RELEASE-05 self-audit](../eval/experiments/2026-10-10-release-05-audit-attempt-v22.md)
retains all human, rights, fit and installation gaps.

The [precommitted REG-040 count/category replay](../eval/experiments/2026-10-10-reg040-count-category-review-result.md)
adds an `EVAL-04`/`CTX-03` evaluation-only warning scoped to explicit
Chinese `点心`/`甜品` quantity pairs. Its 18 related and negative controls
passed; one bounded replay checked 526 aligned pairs on two saved restaurant
drafts and warned on the known 1.8B cue-35 reversal. The 7B cue-35 paraphrase
was outside the lexical rule, and only one of 263 source cues exposed this
relation. There is no measured natural precision/recall or independent
language review; the warning stays out of product v8. The
[v23 RELEASE-05 self-audit](../eval/experiments/2026-10-10-release-05-audit-attempt-v23.md)
keeps G3–G5, audio, rights, clean-install and final release gates open.

The [frozen ten-chat Vivo scene post-edit comparison](../eval/experiments/2026-10-10-vivo-scene-post-edit-v1-result.md)
adds partial `CTX-03`/`LONG-04`/`EVAL-04` evidence using the unchanged
467-cue source and 7B/v8 Russian draft. All ten calls were structurally
valid, but source-aware AI review confirmed **zero of three** primary
relation repairs and a new major displacement of the 1–2 a.m. fact across
cues 327–328. The candidate is rejected before any whole-file run or
checkpoint; five related negative controls kept their main facts, while one
neighboring thanks line lost “everyone.” [REG-072 and catalog v51](../eval/regressions/catalog-v51.json)
pin the raw failure and six fresh, still-unrun controls. No independent
language rating or released SRT follows. The
[v24 RELEASE-05 self-audit](../eval/experiments/2026-10-10-release-05-audit-attempt-v24.md)
retains the source-rights, speech-alignment, audio-fit and clean-install
gaps; v8 and all older source/candidate bytes remain unchanged.

The [source-only frozen Vivo blind-spot review](../eval/experiments/2026-10-10-vivo-stratified-blindspot-v1-result.md)
extends `LONG-04`/`CTX-03`/`EVAL-04` evidence across the beginning, middle
and end of the same 467-cue full file. Fifteen purposively chosen windows
contain 45 unique Chinese cues and 90 paired observations from the two
retained v8 drafts. Source-aware **AI-only** triage marked six windows with
major meaning or scene problems, including CPU cores versus chips,
all-big-core architecture, process technology, scenario-led planning and
a duplicated adjacent cue. [REG-073/catalog v52](../eval/regressions/catalog-v52.json)
pins exact hashes and twelve new unrun related/negative controls. No new
model/TTS/ASR calls or product edit occurred. The broad numeric sampling
feature selected two generic “one” expressions; retain this weakness and
tighten it only in a new predeclared source-only sample. These selected
windows cannot yield a quality rate or model winner. The
[v25 RELEASE-05 self-audit](../eval/experiments/2026-10-10-release-05-audit-attempt-v25.md)
keeps human language assessment, source-rights/alignment, script approval,
audio fit/listening and clean installation open; v8 remains `needs_review`.

The [source-only quantity feature v1 failure](../eval/experiments/2026-10-10-source-quantity-feature-v1-result.md)
and [bounded v2 replay](../eval/experiments/2026-10-10-source-quantity-feature-v2-result.md)
improve future `EVAL-04`/`LONG-04` sampling without changing the frozen
REG-073 selection. The v1 classifier marked 20/467 Chinese cues, including
five idiom, ordinal and chip-model false positives. Precommitted
[REG-074/catalog v53](../eval/regressions/catalog-v53.json) pins the
minimal source hashes and ten authored controls. One v2 source-only
replay removed exactly those five IDs, added none, and passed the controls;
15 cues remain marked. There were zero translation/model/audio calls and
zero bilingual human reviews. v2 may guide a future *new-source* sample,
but cross-source precision/recall, translation facts and G3–G5 remain
unproven. The [v26 RELEASE-05 self-audit](../eval/experiments/2026-10-10-release-05-audit-attempt-v26.md)
retains the same blocked release gates.

The [bounded Vivo technical-sense screen](../eval/experiments/2026-10-10-vivo-technical-senses-v2-result.md)
adds direct 7B model evidence for `CTX-03`/`EVAL-04`: 28 matched real
answers on three exposed natural term cases and eleven authored controls,
with 56 preflights and 8,119 total tokens. Source-scoped provisional
definitions repaired two natural CPU-architecture meanings, but the
negated multi-core versus multi-processor control failed in both arms.
The v1 [REG-075](../eval/regressions/reg-075-continuation-not-negation-v1.json)
preflight false abstention was retained with zero model calls; the
separately frozen v2 fixed that scope error before inference. The new
[REG-076/catalog v54](../eval/regressions/catalog-v54.json) pins the
shared semantic failure and six unrun contrast controls. Candidate
shortlisting/full-file advancement was rejected; product v8 and both
full-file SRTs remain unchanged. Source-aware judgments are AI-only,
not a G3–G5 quality score. The [v27 RELEASE-05 self-audit](../eval/experiments/2026-10-10-release-05-audit-attempt-v27.md)
keeps translation, audio, rights and clean-install gates open.

The [Vivo same-voice real-SAPI rate screen](../eval/experiments/2026-10-10-vivo-sapi-rate-result.md)
adds partial `VOICE-02`/`VOICE-03` evidence from Auralis local commits
`2d432e6`, `93cd2cf` and `f4f820e`. The one bounded run synthesized 36
real WAVs for 12 identical source/draft cues at rates 0/5/10. All decoded
with signal and no clipping; summed durations were 69,242/40,077/23,158 ms,
and 0/8/9 cues fit at 1.5x with a 75-ms margin. Rate 10 passed only its
predeclared screen for a later private audition; three sample cues still
miss that fit limit. There was zero human listening and no new full-file
TTS. The [v28 RELEASE-05 self-audit](../eval/experiments/2026-10-10-release-05-audit-attempt-v28.md)
keeps A1–A6, G3–G5, source rights and clean installation open.

The [private Vivo rate audition packet](../eval/experiments/2026-10-10-vivo-rate-audition-packet-result.md)
adds partial `VOICE-04` preparation at Auralis local commits `d7afd9b`
and `7ca79a9`: nine byte-matched real WAV copies cover three exposed
beginning/middle/end cues at rates 0/5/10, with a private blind player
and empty review form. There were no new TTS calls and no human listeners.
The [v29 RELEASE-05 self-audit](../eval/experiments/2026-10-10-release-05-audit-attempt-v29.md)
keeps A1–A6 and G3–G9 open; the short packet is not a full-scene A4 check.

The [frozen REG-076 v3 screen](../eval/experiments/2026-10-10-reg-076-negated-multicore-v3-result.md)
adds one bounded 120-reply, 240-preflight real-model comparison to
`CTX-03`/`EVAL-04`. All 60 source/seed pairs were retained and source-aware
AI inspected, with zero human bilingual ratings. Two exposed natural
technical senses improved, but the new two-chip versus single multi-core
chip contrast failed in all three candidate repeats; a second control
lost multi-core within each chip in one identical-request sample. Only
14/18 new REG-076 control cells preserved the primary fact, below the
frozen all-pass rule. The candidate is rejected; the v8 product profile,
both complete SRTs and private audio remain unchanged. [REG-077/078 and
catalog v55](../eval/regressions/catalog-v55.json) retain minimal failures
and twelve new unrun related/negative cases. The [v30 RELEASE-05
self-audit](../eval/experiments/2026-10-10-release-05-audit-attempt-v30.md)
keeps G3–G9, A1–A6 and release acceptance open. Next: diagnose the
chip/core/processor referent with those controls in a separately frozen,
budgeted comparison before any long-file or voice-script advancement.

The [REG-077 v4 source-relation-card screen](../eval/experiments/2026-10-10-reg-077-referent-v4-result.md)
performed that one frozen comparison: 192 real 7B replies, 384 preflights,
52,206 tokens, 96 matched source/seed pairs and zero human ratings. A
target-only card exposed the exact separate-chip/single-multi-core contrast
in six candidate cells; **all six still changed the denied multi-core
chip into a multi-processor chip**. The remaining 117 prior request/output
cells were byte-identical to v3. New one-core controls expanded the
shared Russian agreement defect by twelve cells. The candidate fails its
frozen advancement rule; v8 and both full-file drafts remain unchanged.
[REG-079/080 and catalog v56](../eval/regressions/catalog-v56.json)
retain three minimal reproductions and twelve additional unrun controls.
The [v31 RELEASE-05 self-audit](../eval/experiments/2026-10-10-release-05-audit-attempt-v31.md)
keeps G3–G9/A1–A6 open. The next quality task is a conservative
source-aware warning/adjudication path with measured cross-source false
positives and grammar controls, rather than another unmeasured prompt
variant or a full-file run on this rejected candidate.

The [frozen chip/core warning screen](../eval/experiments/2026-10-10-chip-core-warning-v1-result.md)
adds partial `EVAL-04`/`CTX-03`/`LONG-04` evidence. One offline replay
checked 192 exposed v4 replies plus 1,728 aligned pairs across five
complete Vivo, ASUS and Sethlui drafts, with zero model, ASR or TTS calls.
The narrow source-aware signal caught all 13 previously AI-marked errors
of the denied multi-core referent class and all 18 `один ядро` agreement
errors in the selected replies. The complete drafts had zero matching
Chinese source triggers and zero warnings, so natural precision and useful
coverage are unmeasured. Human bilingual reviews remain zero. The rule
stays in `eval/`; product admission and RELEASE-05 are rejected in the
[v32 self-audit](../eval/experiments/2026-10-10-release-05-audit-attempt-v32.md).
Next, derive a source-only fact relation from real cues of a distinct source,
freeze positive and related negative controls before viewing targets, and
measure trigger coverage and adjudicate every warning. Preserve the v8
baseline and all retained failures; do not advance the long file on this
warning alone.

The [bounded Qwen3 8B local screen](../eval/experiments/2026-10-10-qwen3-8b-local-screen-result.md)
adds partial `CTX-02`/`EVAL-04`/`DECIDE-01` evidence on the same version-matched
Vivo source. An official pinned Q4 weight was acquired once into ignored
private storage; 36 matched real replies and 72 preflights were structurally
valid. AI source-aware review found that Qwen3 preserved the two chip/core
negation contrasts in 6/6 cells where v8 failed, but lost the big-core
modifier in all three repeats of a natural cue and added Russian agreement
errors in six authored cells. The predeclared shortlist rule therefore
rejects Qwen3; no complete file or TTS was run on it. [REG-081/082](../eval/regressions/catalog-v57.json)
preserve the minimal failures and 12 unrun new related/negative controls.
This screen does not change the selected v8 profile, accepted results or
`DATA-03` admission: the Chinese caption rights, source listening, independent
bilingual review, G3–G5, A1–A6 and `RELEASE-05` remain open. The next
independent quality task is source-only cross-source fact-relation coverage
and false-warning measurement; a model replacement would require a separately
frozen candidate with no new major errors before any long-file pilot.
