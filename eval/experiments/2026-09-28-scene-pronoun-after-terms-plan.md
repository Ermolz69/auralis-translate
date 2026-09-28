# Predeclared actor-number regression after v5 terms template

Frozen before inference on 28 September 2026. The terms feature changed the
v5 prompt template for every arm, including those with no terms. Recheck the
known `REG-002` singular/plural failure on the same authored development
scenes `r01`–`r04`. This is not a new attempted repair or a release-quality
score. Keep the previous [regression](2026-09-28-scene-context-results.md)
and [failed prompt repair](2026-09-28-scene-number-repair-results.md) immutable.

Run `task eval:context:scene:after-terms` once, no-context then scene arm per
case, one repetition, eight complete files, at most 26 chats and 104 total
loopback requests, ten minutes after readiness. The source/scene IDs,
expected facts and proposed references are held outside model requests.
Stop and retain failure evidence on any structural, source-integrity,
tokenizer, export or resource failure. Check three singular cases and the
explicit two-brother plural control by source-aware AI inspection; independent
human review remains open.

Dataset SHA-256:
`63f15c9613890460e86b2ab1d9019f3fb092c3e61ae1f4ea55ac14823c336243`.
No-context and scene profile SHA-256:
`18c944068c656a5f70663eb3b282f4da48dae455975e9e79d2280ebe3e3cad8a`,
`d6ae29c6cf189dbca609d76e32b270cb2fd00c9fb2b14d76bb048142f40094f3`.
Both pin v5 template SHA-256
`7eed5a47e3679f8b20113dd2842bf581b9760c56d83c84283b57884c3e4414a1`.
GGUF SHA-256 is
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`;
runtime executable SHA-256 is
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
Hardware: RTX 3070, 8,192 MiB reported VRAM. The report will retain
per-request raw responses, rendered prompts, tokens, time, resource samples,
accepted text and offline export checks.
