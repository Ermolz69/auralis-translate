# Fresh single-target v8 comparison on the same natural 268-cue SRT

Date: 2 October 2026. Partial `LONG-01` / `LONG-02` / `EVAL-04`.
The four-target [first run](2026-10-02-v8-asus-natural-long-result.md)
and [copy-only resume](2026-10-02-v8-asus-copy-resume-result.md) failed
without full SRT. A changed batch size requires a **fresh** run identity,
not a rewritten checkpoint plan. This paired, known-development test changes
only `target_segments_per_block` from four to one. The source-only neighbors,
v8 prompt, model, decoding settings, provisional one-video scene, tokenizer,
runtime and source remain fixed. No Russian reference or prior accepted
translation enters requests. Prior states and failures remain immutable.

Private source SRT: 268 cues, SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
Paired private media SHA-256
`9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1`.
Runtime SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
Provider-fixed release CLI SHA-256
`5cc85dee7751256ddf6963ed5606bac092d54ca91c1263001bcaf22898a158b3`.
Prompt template SHA-256 remains
`3e59c7dd662eb0260f12c785386ac447349cf1472cfe23b46d060a57f1c1c9d9`.

| Arm | GGUF SHA-256 | New single-target manifest SHA-256 |
| --- | --- | --- |
| Hy-MT2 1.8B Q4_K_M | `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699` | `3762873e48f3e7864d3cf655e295d4ac383dd30ac5f7292f53f25fc5887761d7` |
| Hy-MT2 7B Q4_K_M | `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b` | `a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc` |

Run 1.8B then 7B in isolated fresh states, one server at a time, 2,048
context, 99 requested GPU layers, one slot, Jinja, RAM cache off. One
CLI command per arm; at most 268 chat calls, 536 template/tokenizer calls,
20 minutes CLI and 3 minutes readiness per arm, 50 minutes total. No
model retries, parameter search or restarts in this experiment. Stop each
arm at its first failed candidate, retain its raw response and durable
prefix; continue to the other arm if shared identities remain valid.
Record exact start/middle/end and every seam, names, numbers, negations,
scene continuity, time, memory and tokenizer counts. If complete, export
one separate `needs_review` SRT and verify its 268 IDs, timing, source
hash and protected bytes. An AI risk audit is separate from independent
bilingual review. Rights on the natural subtitle track and speech
alignment are unresolved; publish only source-free aggregates and hashes.
No audio candidate is approved by this engineering screen. G3–G9/A1–A6
remain open until their own criteria are met.

Use `task eval:long:v8:asus:single:preflight`, then
`task eval:long:v8:asus:single:probe` once. Retain all results and run
`task eval:long:v8:asus:single:report` and
`task eval:long:v8:asus:single:check` afterward.
