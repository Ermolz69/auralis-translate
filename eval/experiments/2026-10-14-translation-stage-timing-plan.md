# PERF-02: translation stage timing and response-length inventory

Frozen before new model requests on 14 October 2026. Baseline code is
`a11a5a92ba8c7cc79a64f4a10a034dcb6a311de7`. This is measurement only:
the v8 prompt, four-cue target policy, model parameters and result rules do not
change. Old runs and failures remain immutable.

## Material and boundaries

The retained private ASUS v8 natural-source file has 268 cues and SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
The old 1.8B/7B SQLite journals in
`.cache/eval/v8-asus-natural-long-v1/attempt-UhjJZn/` have respective hashes
`e0d87164c730c362168e8109b3adbea9bb23965845f69f0bb31f02eac5a5f851`
and `142290cb9cad56b83013fb00db57de7611a80ee6e8a7072a85d3410a1ca575c0`.
The resumed-copy journals are separately identified by
`520d7628753ca8db2a8d94e8e3c9130fddb9b588aa658924b2f8c0a665d78b44`
and `f488d248e4ca99cc6c7f9b0efa1a7307f6d7b3e99876213b2df190b7399310f4`.
Read these without migration or mutation and never pool distinct attempts as a
single run. Raw source, prompts, replies and output remain in ignored storage.

The checked models are Hy-MT2 1.8B and 7B Q4_K_M, with GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`
and `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`.
Runtime build is `b10977-0ecb159c9`, executable SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The existing v8 four-cue manifests stay unchanged; their SHA-256 values are
`1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f`
and `c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`.

## Declared runs and limits

First summarize the old read-only journals. Then run one fresh exploratory
268-cue SRT soak per model, 1.8B followed by 7B, using the original scene map,
v8 manifest and externally owned server so context and target policy match the
old natural-source runs. Each arm has a fresh SQLite state and output. The local
CLI does not accept a scene map, so model-launch and local hashing measurements
use a separate 32-cue ASUS prefix per model through `translate-local`. That
prefix is normalized with LF and has SHA-256
`fd6cd05e2a2fcf223a25216122161be75e940ec0f43068b217ea51c04587cd73`.
The two local-only manifests differ from the pinned v8 manifests only by zero
before/after context and zero maximum context bytes; their serialized SHA-256
values are `32b6269105bc73de973cee0b0c8163b1289cd217b844eb0e719c48465425c432`
and `a7850c4eb44b52597e1c3ba53d3342009d86373d8c320dd136e58dff563bfbf9`.
These local-prefix measurements are not compared as a same-policy translation
speed baseline against the 268-cue scene runs.

For each model, allow one natural soak and one local prefix run, no automatic
retry. Each natural arm is capped at 20 minutes, 268 chat requests, 1,000 token
preflights and 300,000 prompt-plus-completion tokens. Each local prefix is
capped at 10 minutes, 32 chats and 128 preflights. The complete probe is capped
at 45 minutes. Stop on model/runtime/profile/source mismatch, exceeded budget,
server failure or CLI failure; retain the error and durable prefix. Do not
relabel a failed run as successful. The source is known development material,
not a release holdout, and no Russian reference enters inference.

## Measurement and decision rule

From every actual chat journal row, report completion/prompt tokens,
`max_tokens`, finish reason, outcome, duration and target-slot count when
parseable. Keep null usage null. Report count, sum, nearest-rank p50/p95 and
maximum separately per model, attempt and outcome. Include context trims,
splits, missing usage and request counts. The journal's `elapsed_ms` covers
provider HTTP plus parsing/admission, not pure network time.

Opt-in monotonic CLI spans cover source inspection, pre-launch hash, spawn to
ready, durable model preflight, translation execution, journal begin/finish,
checkpoint load/commit, result commit and output write. Durations are nested:
never add child request/storage spans to their parent execution span or label
the residual as a measured stage. Measure CLI wall in the harness. Separate
the external-server and local-owner tracks, cold process and later starts;
OS file-cache state is unknown. Preserve CLI events and SQLite schema.

Publish a source-free machine report and English result record with counts,
durations, failed-attempt limitations, hashes, task checks and next performance
decision. No whole-file speedup, language-quality or release claim follows
from timing data alone.
