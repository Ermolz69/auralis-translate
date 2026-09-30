# Natural ASUS slot-schema screen: target ID repaired, language unreviewed

Date: 30 September 2026. The [frozen plan](2026-09-30-natural-asus-slot-schema-screen-plan.md)
and runner were committed as Translate `f4f9078303a1120c6c92560de72d5d51fa6faf61`
before any new inference. `task eval:natural:asus:slot-schema:preflight`
verified the archived failed request, original Chinese SRT, 1.8B GGUF,
profile, llama.cpp executable and CLI. One
`task eval:natural:asus:slot-schema:probe` run then made exactly six chats:
three seeds, each with baseline and target-constant-schema arms. The source,
prompt, context IDs 19/21, sampling and runtime were identical within each
pair. Only the seed was added to the archived request, and only two schema
properties changed between paired arms. No earlier Russian answer or expected
translation entered a request.

| Seed | Baseline returned ID / structural result | Constant schema returned ID / structural result | Prompt / completion tokens (baseline; constant) |
| --- | --- | --- | --- |
| 101 | 21 / rejected | 20 / accepted | 279 / 57; 279 / 52 |
| 202 | 21 / rejected | 20 / accepted | 279 / 54; 279 / 54 |
| 303 | 21 / rejected | 20 / accepted | 279 / 45; 279 / 58 |

All six HTTP responses were 200 and valid JSON. The baseline reproduced the
following-context ID error in 3/3 seeded requests; the constrained schema
returned the declared target ID in 3/3. The prior unseeded failure is a
separate fourth observation, not part of this paired denominator. The six
responses used 1,674 prompt and 320 completion tokens. Chat walls were 565,
421, 428, 507, 399 and 488 ms in request order; complete harness wall was
12,868 ms. One five-second process sample recorded a 1,540,976,640-byte
server working set and 2,235 MiB whole-device RTX 3070 use. This is neither
an isolated peak nor a complete-file throughput result.

The private raw report is
`.cache/eval/natural-asus-slot-schema-screen-v1/run-b5AhOd/report.json`,
SHA-256 `0fc64a935e3f2bccdcd3b54e1dd6adda05982acdd63e87dde3b133e6f7b4645b`.
It retains every request, raw response, candidate, hash, usage, timing and
resource sample. `task eval:natural:asus:slot-schema:check` verifies its exact
one-factor pairs, IDs, raw bytes and budget. The original 19-checkpoint
failure remains unchanged, with zero complete results and no output SRT.

AI source-aware inspection, **not human review**, reads the target as crisp
shoulder-button feedback and long travel of the Hall-effect trigger. The
baseline answers, despite carrying the wrong ID, refer largely to the target
subject rather than translating the neighboring Xbox-controller comparison.
The constrained answers carry the correct ID but vary or distort the
technical nouns, including unnatural Russian for shoulder buttons and the
Hall trigger. There is no independently approved translation or language
score. The schema shows a structural effect on this inspected cue; it has
not passed broader natural scenes, seams or a full-file run. No profile is
promoted, no model or precision decision is made, and G1–G9/A1–A6 remain open.
