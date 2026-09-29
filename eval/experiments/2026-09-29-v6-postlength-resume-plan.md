# Frozen one-attempt recovery after the v6 length failure

Experiment ID: `long-v6-postlength-resume-1024-v3`, declared 29 September
2026. The [original 964-block timeout](2026-09-29-long-v6-scene-timeout.md),
[copied-state locator failure](2026-09-29-v6-timeout-continuation-v1-failure.md)
and [982-block model length failure](2026-09-29-long-v6-relocated-continuation-failure.md)
remain immutable failures. The paired [model screen](2026-09-29-reg-006-paired-model-probe-results.md)
found two valid 1.8B responses for the same cue fact under different seeds, but
does not establish reliability or quality. This experiment measures explicit
recovery under the **unchanged** 1.8B candidate; it is not a release retry
policy or a model choice.

Copy the stopped `failed` state under
`.cache/eval/long-v6-relocated-continuation-runs/continuation-cXUYur` to one
new workspace under `.cache/eval/long-v6-postlength-resume-runs/`. Verify the
three quiescent SQLite components before and after the experiment:

| Component | SHA-256 |
| --- | --- |
| `auralis-translate.sqlite` | `26acd2e45baf0fc3175227686a8772db5dc45fd8d6336f28dd0976fbdeaa66af` |
| `auralis-translate.sqlite-wal` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `auralis-translate.sqlite-shm` | `fd4c9fda9cd3f9ae7c962b0ddf37232294d55580e1aa165aa06129b8549389eb` |

The copied state must have the same run ID
`86876d9c-bb84-4450-9214-8eb21f7d262c`, three attempts, 982 contiguous
checkpoints, zero results and no output SRT. Relocate only its copied managed
source locator after verifying source SHA-256
`e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3`
and identical run/checkpoints/attempts/results. Keep the v6 profile SHA-256
`b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5`,
1.8B GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
llama.cpp build `b10977-0ecb159c9`, checked server executable SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
and release CLI SHA-256
`76ab2844996a3d68e9be96035f22f32bfcad79e085a5eacdecddbfa27626452a`.
No prompt, seed, decoding, max-token, source, glossary or reference change is
allowed. Requested server context is 2,048 tokens, 99 GPU layers, one slot and
zero RAM cache; record actual resources without assuming GPU offload.

Run `task eval:cli:long:v6:resume-postlength` **once after committing this
plan and harness**. The budget is 20 minutes from copy/start of inference,
one server start, one CLI resume and a 120-second request timeout; no further
attempt or regeneration within this identity. On success require 1,024
contiguous durable checkpoints with the first 982 byte-identical, four
attempts, one validated result, complete separate Russian SRT, source timing
and protected-byte preservation, exact cue/slot coverage and byte-identical
offline reexport after the server stops. Record all pre-existing and new raw
requests, token counts, duration, resources, warnings and editorial quality
status. On failure keep the copied DB, logs, request journal and no partial
publication. Any follow-up requires a new frozen candidate and budget.

The source is a project-authored synthetic development file. Even a complete
structural result remains unreviewed, does not pass natural-file G3–G5, and
does not license or approve speech under A1–A6. The frozen 43-cue editorial
sample may be extracted only from a fully validated output and must stay
separate from human bilingual judgment.
