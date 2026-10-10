# REG-077 v4: source-local chip/core referent card

Date: 10 October 2026. Tasks: `CTX-03`, `EVAL-04`, `LONG-04`.
The [v3 rejection](2026-10-10-reg-076-negated-multicore-v3-result.md)
retains a three-of-three failure on a source contrast between separate chips
and one multi-core chip. This bounded experiment tests one different source
representation, not a new product profile: a target-only relation card with
the affirmed number of separate chips and the exact denied alternative.
The card is generated only from a narrow Chinese source pattern. Other
requests stay byte-identical to v3. It contains no Russian reference or
expected complete sentence. Source and context slots remain unchanged.

Pin the same 467-cue original SRT, 7B Q4_K_M weights, llama-server runtime,
v8 manifest and prior v3 freeze by SHA-256. Add the six REG-077 and six
REG-078 unrun related/negative controls to the 20 v3 cases. All 32 cases
are exposed development material, not sealed holdout. Use exact matching
source/context/schema and decoder parameters for both arms, seeds
101/202/303 and alternating arm order. Freeze 192 exact request hashes and
source inventories before any inference. The candidate retains v3 positive
technical notes; only an exact separate-chip/single-multicore contrast gets
the new card. Zero global terminology or name hints are added.

Budget: one server start, no retries, at most 192 chats, 384 rendered
template/tokenizer preflights, 180,000 combined tokens, 2,048 context
tokens, 1,024 response tokens and 64 safety tokens, 120 seconds per chat,
30 seconds per preflight and 20 minutes wall. Record raw requests/responses,
accepted text, tokens, time, errors and sampled RAM/whole-device VRAM.
Stop and retain any failure. Do not run another model or audio workload
concurrently. Keep originals, prior results and product v8 unchanged.

Review all 96 source/seed pairs against their Chinese source and context,
separating AI source-aware inspection from independent human ratings. A
candidate may be shortlisted only if the original REG-077 minimal contrast
and the newly eligible related contrast preserve chip count and the
negated single-chip referent in all three seeds, no new major errors occur
in the remaining REG-077/078 controls or previous natural/negative cases,
and the v3 natural technical repairs remain. Same-request sampling errors
must be reported separately; they still prevent a claim of reliable
full-file quality. A shortlist only authorizes a later distinct cross-source
screen. Failed criteria reject the candidate without a full-file rerun,
TTS or G3–G5 claim.
