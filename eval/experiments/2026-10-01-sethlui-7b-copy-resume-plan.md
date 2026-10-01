# Frozen one-attempt 7B restaurant copy-and-resume screen

Date: 1 October 2026. Partial `CTX-02`, `LONG-03`, `LONG-04` and `EVAL-04`
development recovery evidence. The [original same-source comparison](2026-10-01-sethlui-full-v6-model-comparison-result.md)
and `REG-041` remain failed, immutable outcomes. This is a separately
identified continuation, not a reclassification of the first run. Question:
does the pinned 7B v6 profile resume the failed cue-62 prefix from a verified
copy and reach an intact 263-cue result without publishing partial output?

Use private source SHA-256
`4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964`
and matched media SHA-256
`6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6`.
The original failed report SHA-256 is
`81f5ece3871a6ce8b141a2022cee8218cb804274ab97c142f90e58d943bcb1dc`,
its run ID is `ef5f83be-05ab-4410-90ff-ddeb0c4a9c89`, and its 61 committed
blocks must remain byte-identical. The original quiescent SQLite, SHM and WAL
SHA-256 values are respectively
`fdffbaf9f85ac971731f9b5785b4130a4130d54edbd3e00b02864b2df11262be`,
`fd4c9fda9cd3f9ae7c962b0ddf37232294d55580e1aa165aa06129b8549389eb`
and `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
Copy the original state to a unique ignored workspace. Relocate only the
copied managed-source absolute locator after verifying source/run hashes;
check all 61 checkpoints and attempts before and after. Never resume on the
original database or overwrite the existing report.

Use 7B Q4_K_M GGUF SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
v6 profile SHA-256
`e7e2d7745cb283a88984da202eb511f0144b2bc51bc6eb01727515a51e7aa06f`,
release CLI SHA-256
`82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d`
and llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
on the same Windows RTX 3070. Keep the same scene map, one target and one
before/after source cue, 2,048 context tokens, decoding and no approved terms.
No reference, expected answer or earlier Russian output enters the model
prompt. The CLI does not supply a seed; runtime sampling remains unknown.
One changed factor is the fresh server/generation attempt for the failed
suffix, with state copied and source identity unchanged. This is a
development reliability screen, not an independent quality estimate.

Run one `task eval:natural:sethlui:v6:7b:resume` after its nonmutating
preflight. Budget: at most 210 new chats, 650 proxied HTTP calls, one server,
one CLI resume, 20 minutes model-stage wall, 130 seconds per upstream call,
180 seconds server readiness and 600 seconds doctor. No automatic retry,
fallback, profile change, model change, TTS overlap or output repair. The
copy/preflight may be repeated after zero-chat infrastructure failure only
with failed records retained. Stop on identity, resource, grammar, timeout or
persistence failure. Always retain the raw attempted inputs/outputs, errors,
sampled RAM/VRAM, copied state and original/prefix hashes. A second model
failure ends this experiment, not a request to regenerate until success.

On success require 263 contiguous checkpoints, old 61 unchanged, exactly one
complete `needs_review` result, no missing/duplicate cues, exact protected
timing/IDs, original source unchanged and byte-identical offline re-export
without an inference server. Compare beginning/middle/end, seam, names,
amounts, negations and scene continuity in a separate source-aware AI triage;
independent Chinese-Russian review remains mandatory before selection or
audio. On failure report the actual new prefix and no partial publication.
Public reporting includes only hashes and aggregates; private licensed source,
raw responses and Russian candidate stay ignored.
