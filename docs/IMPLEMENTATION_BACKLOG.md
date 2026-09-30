# Tracked implementation backlog

Updated: 2026-09-28. Canonical task state for the
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
| DATA-03 | Licensed development subtitle scenes | in_progress | DATA-01 | Four [initial Commons candidates](../eval/experiments/2026-09-29-commons-candidate-parser-recheck.md) retained 488 inspected cues. The [Mingfay Mandarin derivative](../eval/experiments/2026-09-29-youtube-mingfay-caption-candidate.md) added 230; its [media GET failed at HTTP 403](../eval/experiments/2026-09-29-mingfay-media-download-failure.md) and the [same-source 1.8B/7B screen](../eval/experiments/2026-09-29-mingfay-natural-model-screen-results.md) remains private and unreviewed. The [93-cue Ying run](../eval/experiments/2026-09-30-commons-ying-guarded-full-result.md) was structurally complete but had major source-fact and polarity defects. The [20:30 train video](../eval/experiments/2026-09-30-commons-train-240p-stream-result.md) now has a verified 240p VP9/Opus copy, without verified Chinese speech. The [18:36 Vivo/MediaTek interview](../eval/experiments/2026-09-30-geekerwan-vivo-caption-result.md) adds 467 strict Chinese cues and potential multiple speakers; its [matched 240p video and three decoded source-audio samples](../eval/experiments/2026-09-30-commons-vivo-media-samples-result.md) await actual listening and cue alignment. Two [further 14:42/12:42 Geekerwan candidates](../eval/experiments/2026-09-30-geekerwan-two-scene-captions-result.md) add 268/304 strictly parsed Chinese cues; their [matched 240p videos and six measured but unlistened audio samples](../eval/experiments/2026-09-30-geekerwan-two-scene-media-result.md) are private. A hash-pinned private review packet now links all nine Geekerwan audio windows to overlapping source cues; its human review count is zero. Nine source candidates contain 1,850 inspected and **zero eligible** cues. Rights, speech alignment, scene/speaker boundaries, independent references and approximately 200 eligible development cues remain open; historical Commons/Amara provenance findings remain linked above. |
| DATA-04 | Sealed independent release holdout | ready | DATA-01, EVAL-01 | At least 300 eligible cues; independent groups/references, no tuning exposure; reviewer/source admission still needed |
| DATA-05 | Audit alignment, leakage and reviewer coverage | planned | DATA-03, DATA-04 | Whole-source duplicates/splits, reference provenance, rights, exclusions and balanced review categories checked |
| EVAL-01 | Blind review, scoring and adjudication protocol | done | BASE-03 | [Protocol v1](evaluation/009-blind-source-review.md): source-aware rubric, critical taxonomy, denominators, adjudication and explicit reviewer absence; no human score claimed |
| CTX-01 | Specify composable prompt v5 | done | BASE-03 | [v5 contract](reference/chinese-context-profile-v5.md): source-only scene windows, approved terms, fidelity, identity, token budget and strict slot mapping; documentation checks only |
| CTX-02 | Implement v5 without changing v1–v4 | in_progress | CTX-01, DATA-02, CTX-05 | [V5 envelope](../eval/experiments/2026-09-28-v5-envelope-evidence.md), [scene-map checks](../eval/experiments/2026-09-28-scene-map-admission.md), [paired real scenes](../eval/experiments/2026-09-28-scene-context-results.md), [failed actor-number instruction](../eval/experiments/2026-09-28-scene-number-repair-results.md), [term admission](../eval/experiments/2026-09-28-v5-terms-admission.md), [real paired term probe](../eval/experiments/2026-09-28-v5-terms-paired-results.md), [typed retry regression](../eval/experiments/2026-09-28-typed-provider-retry.md), [inference journal checks](../eval/experiments/2026-09-29-inference-request-journal.md), [HTTP error-body regression](../eval/experiments/2026-09-29-inference-http-failure-body.md), [real paired journal run](../eval/experiments/2026-09-29-inference-journal-paired-results.md), [7B actor-number screen](../eval/experiments/2026-09-29-context-7b-p01-screen-results.md), [real token-preflight journal](../eval/experiments/2026-09-29-inference-preflight-p01-results.md), [four-scene cross-model comparison](../eval/experiments/2026-09-29-pronoun-cross-model-results.md), [inconclusive target-slot schema ablation](../eval/experiments/2026-09-29-slot-schema-ablation-results.md), [CLI model preflight journal](../eval/experiments/2026-09-29-cli-model-preflight-journal.md), and [local Auralis executor preflight journal](../eval/experiments/2026-09-29-auralis-host-preflight-journal.md): source-scoped ledger, frozen prompt identity, transient-only bounded retry and CLI v5 chat plus tokenizer-attempt persistence implemented and verified on authored short scenes; both model sizes repeat the singular actor defect, while CLI and local Auralis executor model verification are journaled; earlier Auralis runtime acquisition, explicit host-job correlation, long-file quality and human review remain open |
| CTX-03 | Scene terms and speaker evidence | planned | DATA-03, CTX-01 | [Term admission](../eval/experiments/2026-09-28-v5-terms-admission.md) is an engineering contract only; independent terminology review and speaker evidence remain open |
| CTX-04 | Paired context/model ablation | planned | CTX-02, CTX-03, EVAL-01 | Budgeted repeated 60-case comparison, unrelated/insufficient-context controls and blinded review |
| CTX-05 | Specify bounded failure, retry and review policy | done | CTX-01, EVAL-02 | [Policy v1](reference/bounded-failure-policy-v1.md) and [invalid-slot retry regression](../eval/experiments/2026-09-28-invalid-slot-retry.md); typed provider errors/raw attempts remain for CTX-02 |
| EVAL-02 | General comparison and evidence schema | done | CTX-01, EVAL-01 | [Record v1](evaluation/010-comparison-record-v1.md), fixture-only [example](../eval/reports/experiment-record-example-v1.json) and seven schema tests; real comparisons remain open |
| EVAL-03 | Context and long-file HTML presentation | planned | EVAL-02, CTX-04 | Same evidence identities; scene/target/seam views, review labels, counts, public rights and raw downloads |
| EVAL-04 | Implement maintained regression and adversarial tiers | in_progress | CTX-01, EVAL-02 | [Initial index](../eval/experiments/2026-09-28-regression-index-v1.md), [REG-002 scene actor evidence](../eval/experiments/2026-09-28-scene-context-results.md), [failed instruction repair](../eval/experiments/2026-09-28-scene-number-repair-results.md), [current-template recurrence](../eval/experiments/2026-09-28-scene-pronoun-after-terms-results.md), [7B recurrence](../eval/experiments/2026-09-29-context-7b-p01-screen-results.md), [four-scene 1.8B/7B controls](../eval/experiments/2026-09-29-pronoun-cross-model-results.md), [typed retry regression](../eval/experiments/2026-09-28-typed-provider-retry.md), [REG-009 durable identifier diagnostic](../eval/experiments/2026-09-29-reg-009-identifier-diagnostic.md), [negative matched prompt screen](../eval/experiments/2026-09-29-reg-009-prompt-screen-results.md), [REG-010 neighbor-content reproduction and time warning](../eval/experiments/2026-09-29-reg-010-neighbor-content.md), [REG-011 1.8B/7B exact-fact and singular-door comparison](../eval/experiments/2026-09-29-long-v6-code-model-screen-results.md), [REG-015 mixed-script repair fixture](../eval/experiments/2026-09-29-reg-015-mixed-script-prefix-repair.md) and [64-seed SRT generated checks](../eval/experiments/2026-09-29-srt-generated-roundtrip-results.md) retain raw failures and structural controls; model fact preservation, broader generative/metamorphic and language coverage remain open under [policy](evaluation/008-regression-and-adversarial-checks.md) |
| LONG-01 | Token-budgeted scene and batch planner | planned | CTX-02, CTX-03 | [Partial real 2,048-token preflight](../eval/experiments/2026-09-28-scene-context-results.md) and [owned 1,024/4,096/10,000-target planner checks](../eval/experiments/2026-09-28-long-scene-planner.md): chat template counts equal server usage, deterministic farthest-context trim and scene-limited mapping tested; target/batch sizing, real long-file token counts and quality remain open |
| LONG-02 | Batch and seam-shift ablation | planned | LONG-01, CTX-04, EVAL-02 | Batches 1/4/8, shifts 0/1/3 on retained scenes; paired seam/interior review |
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
| RELEASE-05 | Audit committed final candidate and regression dossier | planned | RELEASE-01, RELEASE-02, RELEASE-03, EVAL-04, HOST-04 | Gate/artifact/identity agreement, exact-target checks, publication and reviewed severity dispositions; [latest incomplete self-audit](../eval/experiments/2026-09-30-release-readiness-after-vivo.md), [previous audio self-audit](../eval/experiments/2026-09-30-release-readiness-after-natural-audio.md) and [acceptance](RELEASE_ACCEPTANCE.md) |
| VOICE-01 | Reviewed spoken-script handoff contract | in_progress | CTX-01, EVAL-01 | Auralis local `feat/real-tts-pilot` commits `bc71330`, `13c9df7` and `770760a` bind selected verified result, cue/timing/speaker/voice and separate adaptation review fields with [opaque verified lineage](../eval/experiments/2026-09-28-voice-handoff-immutability.md) and a [two-database revalidation guard](../eval/experiments/2026-09-29-voice-selection-reverify.md); local `3000d6a` adds [ordered per-cue voice mapping](../eval/experiments/2026-09-29-sapi-multivoice.md); [private real-SAPI application stage](../eval/experiments/2026-09-29-auralis-private-speech-stage.md) at local `1a9ce76` reverifies before/after TTS and cleans stale private WAVs; [managed real-SAPI batch publication](../eval/experiments/2026-09-29-auralis-managed-speech-publication.md) at local Auralis `3261502` persists 2/2 WAVs with selected-result SQLite guard and outbox finalization in a synthetic two-database fixture; real reviewer identity/evidence, production worker wiring and selection-conditional final media publication remain open |
| VOICE-02 | Real Russian TTS selection and adapter | planned | VOICE-01, LONG-06 | Auralis-owned real audio, resource lease, engine/voice identity and cancellation; exploratory Windows SAPI adapter and failed two-cue fit at Auralis `2812bc2`, [synthetic media and FFplay process check](../eval/experiments/2026-09-29-sapi-synthetic-media.md) at local `a468801`, [real one-boundary cancellation cleanup](../eval/experiments/2026-09-29-sapi-cancellation.md) at local `5c6e38c`, [two-voice synthesis with failed original cue fit](../eval/experiments/2026-09-29-sapi-multivoice.md) at local `106ecdf`, [two-voice synthetic media playback](../eval/experiments/2026-09-29-sapi-multivoice-media.md) at local `c788ddc`, and [real private application-stage synthesis](../eval/experiments/2026-09-29-auralis-private-speech-stage.md) at local `1a9ce76`/`15485b6` with 2/2 decoded WAVs but failed 1-second-window fit do not satisfy dependencies or A2/A3 |
| VOICE-03 | Duration fit, mixing and mux policy | planned | VOICE-02 | [Private tempo-only fit screen](../eval/experiments/2026-09-29-sapi-original-window-fit.md) at local Auralis `0afa465` puts the two real SAPI WAVs into their original synthetic cue windows and decodes/plays the MP4; 1.533×/1.736× speech remains unlistened and unselected, while reviewed meaning, natural scenes, accepted limits and production media orchestration remain open |
| VOICE-04 | Human-listened three-scene dubbing pilot | planned | VOICE-03, RELEASE-01, VOICE-07 | Reviewed translation input, 10–20-minute scenes, proposed audio gates and reviewer evidence |
| VOICE-05 | Full-length dubbing soak and recovery | planned | VOICE-04, LONG-04, RELEASE-02 | Real complete media, no missing/duplicate audio, resume and resource contention evidence |
| VOICE-06 | Dubbing pilot release decision | planned | VOICE-05, RELEASE-04 | Playback/listener results, media provenance and audio limits separate from translation gate |
| VOICE-07 | Maintain speech and pronunciation regression controls | planned | VOICE-01, EVAL-04 | Real names/amounts/homographs/scene-boundary audio, lineage, fit/clipping and listening controls |
| ASR-01 | Transcript creation/alignment without source subtitles | deferred | VOICE-01 | Separate Auralis real ASR contract and recognition/alignment evaluation; not needed for subtitle pilot |

| LANGUAGE-01 | Separate Japanese admission and release evidence | deferred | RELEASE-04 | Japanese scenes, names, context, reviewers and independent G1–G9; no Chinese transfer claim |

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
