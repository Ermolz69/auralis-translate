# REG-062 exact-occurrence terminology: frozen development screen

Date: 3 October 2026 (+03:00). Experiment `reg-062-occurrence-terms-v1`.
Backlog `TERM-02`; partial EVAL-04/CTX-03 evidence only. The existing v8 manifest,
runtime, model and rejected REG-061 transformer remain unchanged. No source or
reference sentence is rewritten after model output. This is one experimental
request transformer, not an approved glossary or product default.

## Diagnosed failure and single candidate

The frozen REG-061 request for `鼠标垫缺货，鼠标支架仍有现货。` inserted a whole-slot
manufacturer hint `鼠标垫 = коврик для мыши` before the unchanged v8 input JSON.
The raw v8 response kept a pad-like item out of stock and a separate mouse
attachment available. The raw hinted response said the pad was out of stock
but made the available item `коврик-стенд`, importing the pad word into the
stand. REG-062 pins both exact raw response hashes. The failure is semantic:
the JSON structure passed while the second noun identity did not.

The candidate binds each admitted provisional term to exact source-character
spans in one target slot. It marks any declared, actually present contrasting
source noun as a separate unhinted referent, with a source-grounded English
sense and an instruction to translate it independently. Pad, stand, stockout,
availability, polarity and actor attribution must remain separate. The candidate
uses neither a general glossary note, a full-sentence reference, neighbor text
to activate terms, nor exact-phrase output replacement. The old conservative
negation, quotation and ambiguous-use exclusions remain. With no eligible
target occurrence, the whole JSON request serializes byte-for-byte as v8.

## Predeclared cases and comparison

The first fifteen cases are exactly the ten REG-058 controls and five REG-061
controls from the previous immutable freeze. The next three are REG-062's
previously unrun reversed stockout, pad-bought/stand-not-bought and stand-only
controls. Two authored extras test reversed source order at a beginning seam
and different reported speakers at an end seam. All twenty are exposed
development cues; none belongs to a sealed holdout. For each case, v8 and the
single candidate receive identical target source, context, cue identity and
decoding settings. Three paired runs per arm are counterbalanced by case and
run index: 20 x 2 x 3 = at most 120 chat calls. No semantic retry is allowed.
The first fifteen baseline requests must retain their prior frozen hashes.

The source-fact rubric is set before inference. For every response, mark
structure separately from source adequacy. The positive controls must keep
multi-core versus multi-processor/thread identity, score and pad versus stand
identity. Availability contrasts must keep which noun is out of stock and which
is available. Buying contrasts must keep bought/not-bought polarity. Negated
or quoted mentions must not become positive claims. The speaker case must keep
the A/B attribution. Price and numeric controls must preserve comparison,
amount and unit. A hybrid pad-stand, swapped noun, flipped stock state,
invented actor, lost negation or imported neighbor fact is a major fact error.
Unclear meaning is `needs_review`, never an advancement pass. Russian style is
recorded separately. The predeclared control facts stay outside model requests.

Advance only if all 120 responses are structurally valid, all three candidate
runs for every known positive preserve its concept, the candidate has fewer
positive fact failures than paired v8 with an improvement for both the multi-core
and pad concepts, and every candidate run for every control has zero new
major/critical fact, polarity, availability, speaker or referent errors and zero
`needs_review` verdicts. Otherwise reject this candidate, retain product v8,
and do not start a 268-cue run. A passing development screen would justify only
a separate decision on an experimental profile; independent bilingual review,
source admission and G5/RELEASE-05 remain open.

## Identity, budget and evidence

Freeze exact private requests, public request hashes, code/policy/corpus and
source hashes, model/runtime/manifest hashes, decoding settings and resume
identities before any model call. The previous source-only natural context and
slot IDs remain for the fifteen historical cases. Use the same local Hy-MT2 7B
Q4_K_M model, v8 batch-one manifest, CUDA llama-server, 2,048 context tokens,
256 response tokens, 64 safety tokens, one server slot and no seed. Maximum
120 chats, 240 template/tokenizer calls, 120 seconds per chat, 15 seconds per
preflight, 180 seconds readiness and 900 seconds for the model stage. Stop on
transport, resource or wall-budget failure; retain the failure and do not retry.

Journal every exact request and raw reply, finish reason, response validity,
token usage, monotonic latency, UTC time, sampled CPU/RAM/whole-device GPU,
sampling errors and server logs. Resource samples are lower bounds with
unmeasured observer overhead. The experiment writes no checkpoint or subtitle
result. A separate source-aware AI review is explicitly non-independent; human
bilingual review count is zero. Retain rejected variants and all uncertainty.

Commands: `task test:term-occurrences`,
`task eval:regression:reg062:freeze`, `:preflight`, `:probe`, `:report`,
and `:check`, followed by affected `task plan:check`, `task docs:check` and
catalog checks. The probe may run once only from a clean committed candidate.
