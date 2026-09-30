# Frozen paired ASUS v6 fact and terminology screen

Date: 30 September 2026. Partial `CTX-02`, `EVAL-04` and `DECIDE-01`.
The retained 268-cue 1.8B v6 ASUS result is structurally complete but has
11 source-aware focus cues across REG-031–033 with serious AI-identified
unit, product-class, technical-term and polarity errors. This development
source is not eligible release data or sealed holdout. The question is
whether the same target-constant v6 requests produce those errors with
1.8B and 7B, and whether 21 already authored related/negative Chinese
controls expose the same categories. This is a diagnosis, not a release
candidate selection or a substitute for independent review.

Use the exact 11 archived source-and-context requests at cue IDs 2, 3,
12, 20, 91, 133, 142, 226, 227, 242 and 267. The source SRT SHA-256 is
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`;
the archived full-run report SHA-256 is
`1d8addf0860cb88f0161ac6eeed3fc45351ab9912aaf0eff2b39a76772a26413`.
The private 44-cue review packet SHA-256 is
`da15e4cf479513ba1a41fc5e86f7802e6531e7c51c5a855e30f675d533485a6a`.
Construct authored controls only from the committed REG-031–033 packs,
with no source context or expected answer in the prompt. Use one fixed
seed, 101, for all 32 cases per model. Pair requests byte-for-byte except
for the model alias; do not alter the template, source, scene context,
sampling or schema between model arms.

Pin the 1.8B and 7B Q4_K_M files, their v6 slot manifests and the same
llama.cpp executable by SHA-256. Use separate servers sequentially at
2,048 context tokens, `-ngl 99`, one parallel slot, no RAM cache, no
request retry. Budget **64 chats, two server starts, 120 seconds per chat,
180 seconds readiness per server and 900 seconds total wall time**. One
run only; a zero-chat infrastructure launch failure may be retried once
after retaining its report. Each response, including malformed, timed-out
and semantically bad replies, stays in a unique ignored private journal.
Record exact prompt/request/response hashes, raw and accepted candidates,
tokens, timings, wall time, memory samples, failure and repository state.
Do not edit, republish or score the original v6 candidate from this screen.

Run preflight through `task eval:natural:asus:v6:fact-screen:preflight` after
committing the plan and harness, then run the single probe through
`task eval:natural:asus:v6:fact-screen:probe`. Verify the raw journal with
a pinned checker before AI source-aware triage. Separate structural counts,
AI observations and **zero human reviews**. A language judgement on these
known development cases does not estimate generalization, and no model,
precision, training or voice decision follows without broader eligible
source and independent review evidence.
