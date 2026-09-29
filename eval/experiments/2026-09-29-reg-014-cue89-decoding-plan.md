# REG-014 cue-89 decoding screen: frozen plan

Predeclared on 29 September 2026 before new inference for `CTX-02`,
`LONG-03` and `EVAL-04`. This is a bounded development screen on the exact
source-only request that stopped the real CLI run. It cannot establish
long-file completion or human Chinese/Russian quality.

Question: on the same cue-89 source, scene neighbors, v6 prompt, checked 1.8B
model and runtime, does greedy decoding preserve `AUR-0089` more reliably
than the failed temperature-0.7 setting? The only changed request parameter
between arms is `temperature`; both use the same explicit seed. The original
unseeded CLI response `АРУ-0089: Поезд отправится в 08:10.` stays as a
historical failure, not a fourth matched repetition. This screen does not
silently retry an invalid product candidate or change the existing v1/v2
profiles.

Input: the cue-89 line-0 rendered request SHA-256
`530ad579a144c55908b02af8a994daa6169dc170a03ba9551c23df8fb15c7231`
from the immutable [failed-run archive](../reports/2026-09-29-reg009-long-cli-prefix-repair-archive.json.gz),
archive SHA-256
`752173e81de4084d7a548734622fa4477b3909dc882cb918f4b1082b132761bd`.
Its target source is `工程 AUR-0089：列车将在 08:10 出发。`;
source-neighbor IDs 88 and 90 are read-only Chinese context. No Russian
reference, prior model result or review enters a request. The project-authored
synthetic source SHA-256 is
`e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3`.
This source group is development only; sealed holdout remains untouched.

The model is Hy-MT2 1.8B Q4_K_M SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`;
llama-server SHA-256 is
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The historical checked v6 prefix-repair profile SHA-256 is
`e80c80b0cf1db26d62ce5f644091f30e42fea752d27a0ce201fcab33f29ecb69`.
The new v2 safety fixture is separate and does not change the model prompt.
Run one server on the current Windows RTX 3070, `-c 2048 -ngl 99 --parallel 1
--jinja --cache-ram 0`, with seeds 101, 202 and 303. Arm order is
`0.7,0.0` / `0.0,0.7` / `0.7,0.0` to reduce a simple warm-order effect.
There are exactly six chat requests, zero retries, one server start, a
120-second per-request cap and a 10-minute total wall cap. Stop and retain
failure on HTTP/JSON/runtime/resource error; do not fill missing outcomes by
running a replacement set. No training, paid backend or concurrent TTS runs.

The preflight rendered prompt SHA-256 is
`b066a2c949862030a3b7a5861220cd1c3e2c45696fde7c00fa7fc158f5e7fdfe`.
The ordered request hashes are frozen before inference:

| Order | Seed | Temperature | Request SHA-256 |
| --- | ---: | ---: | --- |
| 1 | 101 | 0.7 | `dde90b90f5803c6e7d90810beb079d4b02fb5589ed9b8d064cf4c11de37409e2` |
| 2 | 101 | 0.0 | `ee6e594077373283c5fe842ee493d320356b2618068dd91caaeab66140ddb4f7` |
| 3 | 202 | 0.0 | `3423fdc7d54b1d2dd4a70e3c77112159039e4c52c03c5201e9982bc5052a42e1` |
| 4 | 202 | 0.7 | `4eec18a47841f4864060f5d44985e32af68e7090f9c65ba1971c3a447bc5344e` |
| 5 | 303 | 0.7 | `8bab9b4739d92b597a848bbcd27876b6ac0653f135272d93c0a62704b2fb282f` |
| 6 | 303 | 0.0 | `0df4ef574fe768f1b8679d6c34ba38975872fa0bd0305c4e20b515099c58a6bc` |

Preflight checks exact archive, model, runtime and profile bytes; extracts the
single target request; verifies source/context and absence of Cyrillic prompt
text; and freezes every request/prompt hash. The runner journals each raw HTTP
body, parsed candidate, usage/timing, wall time, source-code/time checks,
errors and sampled process/device memory into an ignored workspace. Capture
retains all attempted responses and failures. Count exact ASCII code, omitted
code, mixed-script code, time fact and schema outcomes separately for each
arm; disclose all paired differences. AI source-aware notes are distinct from
human review, which is absent. A code gain alone cannot select a release
profile or justify automatic invalid-candidate retry.

Commands: `task eval:reg014:decode:preflight`, then one
`task eval:reg014:decode:probe`. The runner, plan and Taskfile tasks must be
committed before the model starts. Raw workspaces are under
`.cache/eval/reg014-cue89-decode/` and are never silently discarded.
