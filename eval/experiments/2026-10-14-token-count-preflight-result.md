# PERF-01: exact one-request token preflight result

Date: 14 October 2026. The [frozen plan](2026-10-14-token-count-preflight-plan.md)
declared the private development journals, pinned models, run order, budgets
and mismatch stop rule before the first model HTTP request. The first attempt
stopped before server startup due to a copied SQLite digest missing its final
character; the second stopped before server startup on sandbox `spawn EPERM`.
Both failures were retained and the authorized retry used the same prompts.
The [source-free machine report](../reports/2026-10-14-token-count-preflight.json)
links the private report hashes. No release holdout or Russian reference was used.

| Pinned model | Exact pairs | Old/new HTTP calls | Old/new summed HTTP time | Old/new pair p50 | Old/new pair p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Hy-MT2-1.8B Q4_K_M | 60/60 | 120/60 | 613.43/536.97 ms | 7.83/6.61 ms | 16.70/15.17 ms |
| Hy-MT2-7B Q4_K_M | 60/60 | 120/60 | 579.99/502.53 ms | 8.26/7.33 ms | 16.22/12.95 ms |

Each pair used the same `model`, user message and `response_format`, with
alternating endpoint order and three repetitions. Counts matched for v5–v8
saved prompts, Chinese text and repeated-Chinese boundary prompts. The v8
boundary prompt counted 2,048 tokens on 1.8B and 2,224 on 7B; both methods
agreed even above the configured 2,048-token window. This is evidence for the
pinned runtime and sampled prompts, not a proof for arbitrary future builds.
The old and new summed HTTP times differ by 76.46 and 77.46 ms per 60 pairs.
These are local loopback measurements, not a measured whole-file gain or a
controlled baseline for the earlier Vivo file.

Three fresh checked-model local CLI runs used the declared v8 profile with
zero external context, in SRT/WebVTT/SRT order. They saved six
`count_input_tokens` rows and six chat rows, with no `/apply-template` or
`/tokenize` rows. The count requests took 61 ms in total; chats took 16,006
ms. Each run produced a separate structurally valid `needs_review` result,
left the source bytes unchanged and reproduced its output byte for byte with
offline `resume-local`. The private E2E report and retained SQLite/output
states have SHA-256 `a936a7d0a53d66e64f4825063f0b12881c12667a5b57d081fac05ddee051cb47`.

The 117-chat historical Vivo run had 234 preflight calls. With the same 117
admitted prompts on this checked build, the new path would issue 117 count
calls. That is a request-count projection, not a rerun or a wall-time claim.
Model inference still dominated that old run. Translation adequacy, long-file
speed variability and release readiness remain open.

## Validation and remaining limit

`task eval:token-count:parity` passed separately on both installed pinned
models. `task eval:token-count:local:e2e`, `task test:inference-journal`,
`task test:context-v5`, `task test:long-batch-v8`, `task test:v5-terms`,
`task test:cli:local`, `task check`, `task plan:check`, `task docs:check`,
`task site:build` and `task site:check` passed. The deterministic checks cover
one-count journaling, malformed/missing endpoint refusal, preflight pause,
context trimming, batch splitting, legacy counting and schema-10 upgrade.
The first full `task check` found a stale mocked route in the name-action
test server; after updating it, the complete workspace check passed.

An additional `task eval:regression:check` stopped while building the retained
catalog because ignored private file
`.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/report.json` is absent in
this checkout. Earlier checks inside that task passed; the catalog and its
downstream checks have no completion claim from this run. The missing private
record was not recreated from public summaries.
