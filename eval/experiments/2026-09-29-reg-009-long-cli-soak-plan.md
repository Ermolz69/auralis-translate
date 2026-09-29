# REG-009 long CLI product-path soak: frozen plan

Predeclared on 29 September 2026 before this new real-model run. This is a
single `CTX-02`/`LONG-03`/`EVAL-04` engineering experiment. It cannot establish
natural Chinese subtitle quality or release acceptance.

Question: can the opt-in exact source-prefix policy complete and recover the
same 1,024-cue synthetic SRT through the actual checked 1.8B model, CLI,
SQLite checkpoints, result publication and offline export? The previous
non-repair v6 continuation reached a structurally complete file but lost or
changed identifiers on 665 of 1,280 text slots. That immutable baseline
remains at [post-length results](2026-09-29-long-v6-postlength-results.md).

The project-authored repeated-template development fixture
`eval/fixtures/long-file-v1.json` is SHA-256
`0527cab3c4ea38aa91ae65c6f4e52103d7e0c5cde1ab778dc7e9da1a46c43986`. Its generated
1,024-cue, 1,280-slot SRT is SHA-256
`e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3`.
It uses eight scene groups ending at cue IDs 128, 256, 384, 512, 640, 768,
896 and 1,024. The source, scene policy, 2,048-token context, temperature
0.7 and model are the same as the earlier v6 file. The separate opt-in manifest
SHA-256 is `e80c80b0cf1db26d62ce5f644091f30e42fea752d27a0ce201fcab33f29ecb69`;
only strict identifier validation and one-code source-prefix insertion change.
No Russian draft or closed holdout enters prompts.

Use the checked Hy-MT2 1.8B Q4 GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`
and local llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
on the existing Windows RTX 3070 machine. Preflight must verify the exact
profile, source, fixture, runtime and model hashes, the affected tests, release
CLI build and local model doctor before inference. The executable hash and
Git commit are captured at run time.

Run one fresh CLI translation, stop it after at least 16 durable blocks, then
restart the checked server and resume that run once under the same manifest.
The v6 profile allows one attempt per block and no model retry. The one
intentional interruption may leave an in-flight request that is repeated on
resume; allow at most 1,281 chat attempts and 2,562 expected tokenizer/template
preflight calls, with a two-hour wall cap. Do not launch a second clean run to
erase a failure. Retain stopped/error state, raw requests, checkpoints and
server/CLI logs. A malformed or changed code must reject its block rather
than publish a partial result.

On completion verify source/protected bytes, cue timing/order/slots, code
presence, saved checkpoint prefix, checked result hash, no partial publication,
profile-mismatch refusal and byte-identical offline re-export. Archive every
raw/accepted line, prompt/token use, duration, errors and sampled CPU/RAM/GPU
observations. AI source-aware review should examine beginning, seam, middle
and end, names, sums, negations, actor, clock time and scene linkage; it is
separate from independent bilingual review. The known REG-012/013 meaning and
fluency failures remain open even if all codes survive.

Commands: `task eval:cli:long:v6:prefix-repair:preflight` and one
`task eval:cli:long:v6:prefix-repair:probe`. Generated workspaces are private
under `.cache/eval/long-v6-prefix-repair-runs/`; the evidence copier/checker
must retain a failed run as well as a successful one. No source/model output
is selected for release by this engineering soak.
