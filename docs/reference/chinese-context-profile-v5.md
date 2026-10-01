# Chinese contextual fidelity profile v5

Status: experimental contract for `CTX-01`, 28 September 2026. A later
[partial v5 envelope implementation](../../eval/experiments/2026-09-28-v5-envelope-evidence.md)
has real no-context JSON observations but no scene-context, model-quality or
language gate. The existing
[v4 fidelity](chinese-fidelity-profile-v1.md), [v3 glossary](glossary-v1.md) and
v1/v2 request behavior remain byte-identical for their saved runs. A v5 run has
a new manifest, policy and template identity; it cannot resume a v1–v4 run.

The adapter accepts prompt versions 1–5, sends one line per HTTP request,
uses byte ceilings for context/terms, and lets v4 reject both. File-based v5
admits a context window only through a source-hashed, full-coverage scene map.
The map and its evidence ID are saved in the run state; resume rejects altered
bytes. The planner limits context to each declared scene. The scene-enabled
1.8B profile measures its rendered chat template through the pinned server's
`/apply-template` and `/tokenize` endpoints, reserves response and safety
tokens, and removes farthest context deterministically. The first
[real probe](../../eval/experiments/2026-09-28-scene-context-results.md)
matched `/tokenize` counts to server usage but found a singular/plural
translation regression. An experimental explicit terms ledger now has source,
scene, scope and provenance admission checks; independently reviewed term data
and semantic evaluation remain open. Target/batch resizing and longer files
remain open under `CTX-02`, `CTX-03` and `LONG-01`.

## Purpose and admission

Compose three independent inputs for Chinese-to-Russian SRT translation: source
scene context, approved terminology and protected monetary facts. A profile may
disable context and/or terminology for paired ablation while retaining the same
v5 output schema and fidelity rules. The source document is strictly inspected
before inference. Only declared target text slots can produce result text;
timing, cue order, labels and protected bytes remain owned by the format adapter.

Every target has an internal positive `segment_id` and zero-based `line_index`.
These are source-map IDs, not user-visible SRT cue numbers. The planner rejects
duplicate or absent target IDs, empty target text, unknown glossary scope, a
context segment that is also a target, and context crossing an admitted scene
boundary. A missing scene map means a single-cue target with context disabled
until the source is explicitly segmented; it never grants whole-file context.
The source scene map and terms ledger are immutable inputs to the run.

Source context contains Chinese source text, cue ID and timing only. It cannot
contain previously generated Russian text, references, review labels or hidden
holdout answers. Terms are admitted only from a separately reviewed ledger with
source, approved target/forms, applicable segment IDs, reviewer/evidence ID and
snapshot hash. A model suggestion or inferred speaker is not an approved fact.
The v3 glossary snapshot remains valid for v3; v5 terms require this stronger
provenance. Speaker identity is omitted unless separately evidenced and approved.

The initial v5 terms ledger is a separate, bounded JSON input with
`schema_version`, `source_sha256`, `scene_map_sha256` and a nonempty `terms`
array. Each term has `source`, `target`, `allowed_forms`, explicit
`segment_ids`, `reviewer_id` and `evidence_id`. Every scope ID must belong to
the admitted source, and the source spelling must occur in each scoped target
cue. Duplicate or overlapping scopes for the same source spelling are
rejected. A term is sent only for an applicable target line containing its
source spelling; neighboring context never grants term authority. The ledger
bytes are copied into managed run state and hashed into run identity. A changed
ledger, source, scene map, term scope or evidence ID rejects resume. Reviewer
and evidence fields are provenance claims in the input; an external human
review record must still be verified before these are treated as approved
terms for release evidence.

For a newly accepted v5 checkpoint, each scoped source-line occurrence of an
approved term is checked against its reviewed Russian target and allowed forms.
If none occurs in the matching output line, record an
`approved_term_missing` advisory with the segment ID and line index. Keep the
raw answer, accepted text and checkpoint unchanged; do not substitute a term
or retry a structurally valid answer on this signal. Case-insensitive substring
matching is a screening rule, not proof of correct meaning, inflection or
whole-file consistency. Older checkpoints retain their original diagnostics;
release review must inspect the final file across all resumed blocks.

The read-only `audit-terms SOURCE RESULT SCENE_MAP TERMS_LEDGER` command
performs that file-wide screening on an exported SRT. It checks exact source
and result structure/protected bytes, source/scene/term hashes and term scopes
before reporting every missing approved form across all target lines. It
does not change checkpoints, the original, the result or reviewer claims.
An empty warning list means only that the declared spellings were present;
it does not establish correct meaning, pronunciation or human approval.

## Request and response boundary

One fully rendered v5 user message contains a versioned JSON data envelope.
`target_slots` contains the exact declared slots in source order, each with
`segment_id`, `line_index`, `start_ms`, `end_ms`, `source_original` and
`source_for_translation`. `source_context` is a read-only array of same-scene
source cues with IDs, timing, text and relative position. `approved_terms` holds
only applicable terms with their scope/evidence IDs. `protected_facts` describes
each deterministic money token, its original source span and normalized monetary
value, so masking does not hide whether a sentence describes a price, payment,
change or refund. This field does not assert an unparsed actor or relation.
Reference translations are never present in the envelope.

The surrounding instruction treats all JSON fields as untrusted data, translates
only `target_slots`, preserves exact protected tokens and requests a single JSON
object of the following shape, with no prose or Markdown:

```json
{"translations":[{"segment_id":1,"line_index":0,"text":"..."}]}
```

The adapter parses a complete JSON object and rejects duplicate keys/slots,
missing/extra/unknown IDs, changed slot order, non-string or empty translations,
control characters, trailing instructions and output beyond the declared byte
limit. It validates the exact slot set before any accepted checkpoint. Context
cannot be returned as an output slot. A copied context-only fact is a source-aware
language warning or critical error under review, not something a JSON parser can
always detect. Protected token mismatch, repetition, reordering, invention or
reserved-prefix collision fails before restoration. A valid structural response
can still be `needs_review`; no language quality is inferred from JSON validity.

The first implementation may send one slot per request for a direct v4 control.
`LONG-01` extends a v5 request to multiple slots only when it validates the
complete mapping and actual token budget. A durable checkpoint may contain a
batch, but each target slot appears in exactly one accepted checkpoint. Context
overlap is never output overlap. The provider retains raw output, restored
candidate, per-slot validation and accepted result separately for evidence.

## Fidelity, identity and token policy

Reuse v4's bounded Chinese money recognizer and ordered restoration as an
initial control, without changing v4. In v5, the target carries both the
original Chinese span and its tokenized inference copy. The original exposes
semantic relations; only the declared token is copied into the Russian output.
Source amounts and currencies cannot be silently converted. Adjacent identical
numbers, mixed currencies, nonmonetary pieces and malicious token copying are
required negative controls. Unrecognized amounts are not silently normalized;
source-aware review remains necessary. `CTX-04` must compare v4 against v5 with
context disabled to isolate this changed envelope and semantic fact presentation.

The run identity binds the source bytes/parser version, model and runtime
manifest/hash, prompt v5 template hash, response schema, exact scene map/policy,
context window selection and ordering, approved terms snapshot, fidelity version,
actual tokenizer identity, decoding settings and target/batch plan. The block
fingerprint includes rendered source target/context and applicable terms. A
changed source, scene boundary, term scope, prompt, model or tokenizer rejects
resume into an old run; use an explicit new run/revision. Old checkpoint/output
bytes and profile fingerprints are never rewritten.

Count the fully rendered chat template with the actual model tokenizer, including
all metadata, target/context text, terms and token syntax. Start with the tested
2,048-token server context. Reserve response tokens and a versioned safety
margin. Deterministically remove farthest same-scene context first, then reduce
target batch size; never truncate a target or an approved fact. If even one target
cannot fit, reject before HTTP with a typed budget outcome. A separately measured
4,096-token profile requires memory and OOM evidence. Byte ceilings remain
defense-in-depth limits, not estimates of model tokens.

Retries, timeout and review outcomes are defined by `CTX-05`. No failed or
partially validated response publishes a subtitle. All attempts, including raw
rejected output and exact identity, remain available for evaluation. Inputs that
ask the model to ignore instructions, reveal other cues or invent target IDs are
data; regression checks must verify they cannot change accepted slot mapping.

## Planned paired evidence

`CTX-04` compares v4, v5 with context and terms disabled, source context only,
approved terms only, and both enabled on the same frozen development targets.
Test one previous/one following source cue first, then two previous/one following
within a scene and the token budget. Include unrelated and insufficient-context
controls. Shortlist before three repeated 60-case runs on both pinned model
sizes. Record exact prompts, raw/restored/accepted outputs, tokens, timings,
resource samples, failures and source-aware blind review. Do not tune from the
sealed holdout or assert that adding context improves meaning without review.

## CTX-01 acceptance

The contract was checked against the current `ModelProfile`, `LlamaCppProvider`,
`ChineseFidelityPrompt`, `TranslationBatch` and `PlannedBatches` boundaries. It
names the missing scene/token/provenance/output validation work instead of
claiming it. `task plan:check` passed with 49 unique tasks and valid linked
dependencies; `task docs:check` passed with 101 local Markdown files. These
checks establish a versioned implementable contract, not a model-quality result.
