# Frozen paired ASUS source-context width screen

Date: 1 October 2026. Partial `CTX-02`, `EVAL-04` and `DECIDE-01`
development evidence. The 268-cue ASUS v6 candidate is structurally
complete but has source-aware AI-identified errors. The question is
whether three Chinese source cues on each side change those errors
relative to the existing one-before/one-after request. This one-video
scene map is provisional: a wider window may cross an unverified cut.
This source is development data, not the sealed holdout.

Use the exact archived 11 focus IDs `2, 3, 12, 20, 91, 133, 142, 226,
227, 242, 267` from the prior [paired fact screen](2026-09-30-asus-v6-fact-model-screen-result.md).
The private Chinese SRT SHA-256 is
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`,
the 268-cue archived request report is
`1d8addf0860cb88f0161ac6eeed3fc45351ab9912aaf0eff2b39a76772a26413`,
and the frozen source-only review packet is
`da15e4cf479513ba1a41fc5e86f7802e6531e7c51c5a855e30f675d533485a6a`.
Only Chinese source text, source cue IDs/timing and protected source
facts may enter prompts. Russian references, expected meanings, old
model outputs and review labels stay outside the requests.

For each focus cue, construct the narrow arm from its exact archived v6
request. Construct the wide arm by replacing only `source_context` with
up to three ordered source cues before and after, from the same pinned
source. Verify reconstruction of the original one-neighbor envelope,
target slot and v6 reply schema first. Both arms use the same target,
schema, prompt instruction, sampling values, protected facts and
approved-term emptiness. Within a model/seed pair only source context
may differ. Across models only the model alias may differ. Across seeds
only the seed changes. Use seeds **101 and 202**, one request per variant.

Pin Hy-MT2 1.8B and 7B Q4_K_M GGUF, v6 slot manifests and the same
llama.cpp runtime by the SHA-256 values in the prior paired screen. Use
two sequential servers on the current Windows/RTX 3070 at 2,048 context
tokens, 99 GPU layers, one parallel slot and no RAM cache. Before every
chat, ask the actual server `/apply-template` and `/tokenize` for the
fully rendered request; require `prompt_tokens <= 1728` after the 256
response reserve and 64 safety margin, then compare to server chat usage.

Budget: **88 chats** (11 cues × 2 widths × 2 models × 2 seeds), **176
preflight calls**, at most **264 measured HTTP requests**, two server
starts, one attempt per request, no inference retry, 120 seconds per
chat, 15 seconds per preflight call, 180 seconds readiness per server
and 900 seconds total wall time. Run exactly once after committing this
plan, harness and Taskfile command. A zero-chat infrastructure failure
may have one same-byte retry with its first report retained. Stop if the
model/tokenizer identity, pair invariant, actual budget or wall limit
fails. Retain every attempted raw request/response, output candidate,
token count, timing, resource sample and error in an ignored unique
workspace; do not update the original SQLite or publish partial SRT.

Predeclare source-aware questions for review: 2–3 handheld device class;
12 grams versus gigabytes; 20 shoulder buttons and Hall triggers; 91
portable-device chip; 133 weak battery life; 142 single-core comparison;
226 hyperthreading; 227 watts and four cores; 242 XG Mobile dock; 267
mouse pads. Also inspect a new adverse effect in each paired target:
invented neighbor fact, changed target ID, extra Russian text copied
from context, lost negation or a garbled JSON tail. These expected
meanings are **not** prompt fields. Report all 11 pairs and failures,
distinguish AI interpretation from zero human ratings, and do not
promote a model or wider context from this small inspected sample.
