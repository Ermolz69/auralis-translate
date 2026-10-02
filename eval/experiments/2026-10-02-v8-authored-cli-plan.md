# Bounded v8 real CLI batch screen

Date: 2 October 2026. Partial `LONG-01` and `EVAL-04`. The preceding
[direct model screen](2026-10-02-v7-target-first-order-result.md) found that
reordering target/context JSON corrected one known context swap under two
seeds, while two other authored pairs showed no swap in either order. This
does not establish provider behavior. This screen asks whether the new
opt-in v8 profile can complete and durably journal both one-target and
four-target batches through the real CLI, on the same four-cue source.

Source: `eval/corpora/v7-batch-development-v1.zh.srt`, SHA-256
`ad88b2d2f96b153d5d8880175b321167263d7abaae48ca693d89b925459bc8a7`;
one declared scene ending at cue 4. Model: Hy-MT2 1.8B Q4_K_M SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
Runtime: llama.cpp `b10977-0ecb159c9` SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
New checked v8 manifest SHA-256
`1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f`.
Freeze release CLI SHA after `task build:release`. No glossary or approved
terms. The v8 prompt keeps the v7 instruction and source-only scene context,
placing target slots first in the JSON. Same 2048-token server, requested
99 GPU layers, one parallel slot, Jinja and no RAM cache. The server may
still reuse prompt cache across sequential arms; do not infer speed gain from
one run.

Order: size 1 then size 4; fresh state, source copy, scene map and profile
per arm on one server. Each arm may issue at most four chat requests; at most
eight total, 120 seconds per arm and 10 minutes wall including startup, no
automatic retries. Stop after failed size 1 rather than spending on size 4.
Record every preflight and chat body/response, token count, time, process/GPU
samples, SQLite checkpoints, result rows, output bytes/hash, source-after
hash, failure and partial artifact absence in private attempt storage. Public
report contains hashes and permitted authored excerpts. The baseline v7
size-1 arm is a separate retained failure, not a matched timing replicate.

Expected source meaning for source-aware AI inspection, absent from model
requests: Wang says tomorrow is not Friday; ticket is ten yuan and one
must not pay one hundred; Xiao Li may have given the key to Wang; he did
not and left it on the table. Distinguish a structurally complete SRT from
a reviewed translation. These authored cues and generated times are neither
natural eligible source nor sealed holdout. Human reviewer count stays zero.
Run `task eval:long:v8:authored:preflight`, then
`task eval:long:v8:authored:probe`. Keep failed attempts if process security
or inference fails. A successful four-cue CLI result permits broader
nonmonetary and natural-file testing but not a release claim.
