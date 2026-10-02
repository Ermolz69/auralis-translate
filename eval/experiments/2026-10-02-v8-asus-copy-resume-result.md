# Copy-only recovery: more durable 1.8B cues, no complete v8 SRT

Date: 2 October 2026. Frozen [plan](2026-10-02-v8-asus-copy-resume-plan.md);
[source-free report](../reports/2026-10-02-v8-asus-copy-resume.json).
The same 268-cue natural Chinese development SRT and v8 batch-four profiles
were used. Both original failed SQLite databases and original managed
sources stayed byte-identical. Each `resume` ran once on a relocated copy
with the same run ID and checkpoint prefix. The new release CLI SHA-256 was
`5cc85dee7751256ddf6963ed5606bac092d54ca91c1263001bcaf22898a158b3`;
the llama.cpp binary, model and profile hashes are in the report. Its
private trace SHA-256 is
`b1e7507cd64623bce11508cbaad792ec1f583e6ecec9f14640be80d58bcfefe6`.
One earlier zero-model infrastructure attempt failed at `spawn EPERM`
before any state copy or inference; its retained report SHA-256 is
`42c6d87324b8b6d73fecb82f99989ced186745ab46cbf4bef138f30c72737c27`.

| Model | Old → new durable prefix | New chats / preflights | New prompt / completion tokens | CLI ms | Next failure | Full SRT |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 1.8B Q4_K_M | 216 → 244 cues (54 → 61 batches) | 8 / 16 | 3,807 / 1,271 | 20,512 | Cue 245 batch, invalid inner text | none |
| 7B Q4_K_M | 140 → 140 cues (35 → 35 batches) | 1 / 2 | 502 / 1,024 | 42,507 | Cue 141 batch, `finish_reason=length` | none |

The new 1.8B response at cue 245 began after seven successful batches.
It had `finish_reason=stop` but failed the typed inner-target check with
`v7 response contains invalid target text`. Request SHA-256
`071601bdb48768b6e81914315677bdcc78e885278a310c6b477ad7e2ccae71fe`,
raw response SHA-256
`d8c273273f5fcc23ecfcde852b4d5e8a531fd0087296493fff930a4b5ada99c9`.
This is a second occurrence of the REG-054 class at a distinct seam; no
partial SRT or result row was created.

The 7B request at cue 141 was byte-identical to the prior request
(SHA-256 `3049068ad712328bf93ec96bfa62d85dcdc9ebbaefa154cfe9ee9c1f0962358e`),
but this sampled response reached the profile's 1,024-token completion cap
and ended with `finish_reason=length`. Raw response SHA-256
`7d6601b3d2ba126d8c11a4ac312c847bae9c6f79aa4702a957f2a8779c68ac95`.
It was classified `invalid_candidate` before checkpoint. The prior
leaked-JSON provider guard did not get a real positive retest here because
generation stopped earlier; the synthetic provider regression passed.

`task eval:long:v8:asus:resume:preflight`,
`task eval:long:v8:asus:resume:probe` (expected exit 1 for failed model
arms), and `task eval:long:v8:asus:resume:check` were run. The checker
matches the original raw-request tail, all new journal rows, token totals,
contiguous checkpoints, unchanged original database bytes, unchanged copied
source and no exported file. These are engineering facts, not a quality
assessment. The natural source is known development material with unresolved
rights and speech alignment; neither output can be admitted or dubbed.
Next, freeze a new single-target profile experiment with a new state rather
than modifying these immutable four-target runs. Human bilingual review,
real scene seams, listener review, clean installation and G3–G9/A1–A6
remain open.
