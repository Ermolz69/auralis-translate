# PERF-01: one-request exact token preflight

Frozen before the first real probe on 14 October 2026. This is a performance
maintenance slice, not a translation-quality experiment or a release gate.

## Question and decision

For checked llama.cpp build `b10977-0ecb159c9`, does
`POST /v1/chat/completions/input_tokens` return the same integer as the existing
`/apply-template` followed by `/tokenize` with `add_special=false` and
`parse_special=true`? If any count differs, retain the old product path and
record the mismatching raw request and responses in private storage. No
estimated count or relaxed context limit is accepted.

The baseline is the unchanged two-call provider on `main` at `cba0280` and the
retained 7B Vivo v8 run: 117 chats, 234 token preflights, 496,863 ms summed
chat HTTP time and 573,069 ms CLI time. These numbers are not a paired timing
baseline. The one changed factor is the counting endpoint. Prompts, schema,
context selection, reserve and model/runtime remain fixed.

## Frozen development samples and identities

Use exact `apply_template` request bodies from the following ignored local
SQLite journals. They contain development material, not a release holdout;
raw text and responses remain private. The listed SHA-256 values identify the
SQLite files before any probe:

| Prompt family | Private journal under `.cache/eval/` | SQLite SHA-256 |
| --- | --- | --- |
| v5 scene | `inference-preflight-p01-v1/run-dM8h6a/p01/scene/state/auralis-translate.sqlite` | `c2091a405057abe1c91860430dbc65172c42adbda3a3e0451cd30265d62fa341` |
| v6 one-slot | `commons-asus-full-v6-slot-v1/run-7XjHrR/state/auralis-translate.sqlite` | `76e074663d67d40246aae8e7f1b725918bc4cfd13af1bb81d4b15a80a13ac294` |
| v7 four-slot | `v7-authored-batch-v1/attempt-WUmq4Q/batch-1/state/auralis-translate.sqlite` | `760b730a354e56c81a2bb11bc26f1f2bf25c3546e67138199555ec1dac4d1bd0` |
| v8 1.8B | `v8-asus-natural-long-v1/attempt-UhjJZn/1_8b/state/auralis-translate.sqlite` | `e0d87164c730c362168e8109b3adbea9bb23965845f69f0bb31f02eac5a5f851` |
| v8 7B | `v8-asus-natural-long-v1/attempt-UhjJZn/7b/state/auralis-translate.sqlite` | `142290cb9cad56b83013fb00db57de7611a80ee6e8a7072a85d3410a1ca575c0` |

The installed 1.8B and 7B Q4_K_M GGUF files, checked manifests and
`llama-server` binary must match their versioned manifest hashes. The 7B arm
may reuse v5–v7 development prompts after changing only the model alias in
the request. The probe selects first, middle, last and longest stored prompt
per family and adds one repeated-Chinese boundary prompt per response schema.
No Russian reference or expected translation enters a request. Splits are
`known_development`, with no holdout or language claim.

The first invocation stopped before server startup because the copied v7
SQLite digest above omitted its final `0`. The on-disk file matched the
read-only `Get-FileHash` observation; the predeclared identity was corrected
here before any model HTTP request.

## Bound and measurements

Run the old pair and new endpoint on the same warm server, alternating order
for three repetitions per sample and each installed model. No chat completion
is sent. Stop on the first mismatch, malformed reply, server error, model
identity mismatch or 10-minute per-model wall budget. Cap each arm at 100
sample/repetition pairs (300 HTTP calls for old, 100 for new), zero automatic
retries and zero generation tokens. Preserve every attempted request, raw
response, count and monotonic duration in ignored private storage; publish a
source-free summary with model/runtime hashes, sample counts, failures, summed
durations and p50/p95. Count equality is the acceptance gate; timing is
descriptive, not a whole-file speed claim.

After parity, run three fresh short-file checked-model CLI executions across
SRT/WebVTT and repeat offline export. Verify source hash, separate result,
preflight journal cardinality and exact export bytes. Old unchecked profiles
retain the two-request path. If a checked server lacks the new endpoint, fail
before chat rather than silently changing its counting policy.

For this local CLI check, derive a v8 one-slot profile from
`hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch1.experimental.json` by setting
only `context_before_segments`, `context_after_segments` and
`max_context_bytes` to zero. Its serialized SHA-256 is
`82b0d4d5a37ee742dd40697e01e60bb251b5230dbdec29313b05f702e1380193`.
The authored two-cue SRT and WebVTT input SHA-256 values are respectively
`e28a722eb38da1a1f3ebb2c941e78697e835ad7cd7d2d2949794f2028dc2746b`
and `5c89f87be30c903460f70d73d458c84e0cfa02eb83120e23adbc367c2c961bbc`.
Run order is SRT, WebVTT, SRT with fresh state each time, at most six chats,
six preflights, 256 generation tokens per cue and 15 minutes total. No exact
Russian wording is asserted; structural validity and separate export are.
