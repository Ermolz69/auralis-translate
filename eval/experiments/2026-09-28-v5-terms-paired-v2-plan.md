# Predeclared corrected v5 terms probe (v2)

Frozen before the second inference run on 28 September 2026. The
[v1 probe](2026-09-28-v5-terms-paired-plan.md) stopped at 15 chats because
its executable HTTP budget undercounted tokenization and chat calls. The
failed report is immutable. This v2 run changes only the harness budget
calculation and experiment identity, not the model, prompt, sources, term
ledger construction, decoding, case order or review criteria.

Run `task eval:v5-terms:paired` once. Cases `t01`–`t03`, both arms in
`no_terms` then `terms` order, one repetition, six complete authored SRT
files, at most 20 chat requests, **80** total loopback requests and ten
minutes after readiness. The 80 ceiling counts three endpoints per cue per
arm and three preparation probes per file, with eight spare requests. The
new `scene-request-budget` regression test checks that count. Stop and
retain failure evidence on any other error; do not tune this batch after
outputs. Human terminology and semantic review remain unavailable.

Frozen source corpus SHA-256:
`6ae5b080841d22db0b28dbdafa0832101d5ef636b3121884223eb782373cebf1`.
Term profile SHA-256:
`fbd15130aafda335c081166869062225094c8ca5079e99e53824d039105ad70b`.
Prompt template SHA-256:
`7eed5a47e3679f8b20113dd2842bf581b9760c56d83c84283b57884c3e4414a1`.
Pinned model revision and GGUF SHA-256:
`a0c709d9fac510f2c807aa3af52872340dc37a4a`,
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
Runtime executable SHA-256:
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The selected device remains RTX 3070, 8,192 MiB reported VRAM. The raw
report will capture the optimized CLI hash, actual requests, accepted text,
token usage, timings, source/result hashes and sampled memory.
