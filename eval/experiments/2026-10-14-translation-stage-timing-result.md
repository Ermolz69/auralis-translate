# PERF-02: measured response lengths and translation stages

Measured on 14 October 2026 (UTC+03:00) under the [frozen plan](2026-10-14-translation-stage-timing-plan.md).
The [source-free machine report](../reports/2026-10-14-translation-stage-timing.json)
contains exact counts, nearest-rank p50/p95/max, model/profile/runtime hashes,
UTC timestamps, attempt identities, SQLite hashes and per-phase microseconds.
Private raw requests, source and outputs remain in ignored `.cache/eval/stage-timing-v1/`.

## Runs and boundaries

The first attempt (`attempt-YLA2o8`, code `91f2a54`) exposed a harness error:
`translate-v5-scene` does not support machine protocol v1. Both natural arms
stopped before inference with exit 2; both separate 32-cue local arms completed
and re-exported byte-identical outputs. The unsupported invocation was fixed in
`895bf25`, and the second bounded attempt (`attempt-VhgCi9`) retained the same
model, runtime, source and profile identities. It made no automatic retry of a
translation block.

The corrected natural-source arms reached 8 and 27 chat requests before an
invalid candidate stopped each run. Both rejected candidates leaked JSON
structure into model text. Respectively 7 and 26
checkpoints survived, with no result or output published. These are partial
translation attempts, not complete 268-cue translations. Both corrected local
32-cue arms completed eight four-slot blocks, committed one result, preserved
the source and passed offline byte-identical re-export. The local arms use a
declared zero-context derivative profile and must not be treated as a matched
speed baseline for the natural scene-map arms.

## Response-length inventory

The retained v8 ASUS journals were read without migration. Each row in this
table is one chat request; resumed-copy attempts are separate observations,
not pooled with their earlier runs. All shown requests reserved 1,024 output
tokens and had four target slots.

| Journal | Chat requests | Validated / invalid | Completion tokens p50 / p95 / max | Chat elapsed sum | Count requests / elapsed sum |
| --- | ---: | ---: | ---: | ---: | ---: |
| Prior natural 1.8B | 55 | 54 / 1 | 161 / 237 / 244 | 77,257 ms | 110 / 329 ms |
| Prior natural 7B | 36 | 36 / 0 | 182 / 229 / 235 | 124,756 ms | 72 / 293 ms |
| Prior resumed copy 1.8B | 63 | 61 / 2 | 160 / 235 / 244 | 86,948 ms | 126 / 421 ms |
| Prior resumed copy 7B | 37 | 36 / 1 | 184 / 235 / 1,024 | 142,011 ms | 74 / 302 ms |

The 1,024-token 7B maximum is an invalid `finish_reason=length` response,
not a normal accepted completion. It prevents treating p95 as a safe new hard
cap. The new one-request counter produced one `count_input_tokens` row per chat:

| Corrected fresh arm | Chat requests | Validated / invalid | Completion tokens p50 / p95 / max | Chat elapsed sum | Count elapsed sum |
| --- | ---: | ---: | ---: | ---: | ---: |
| Natural 1.8B, partial | 8 | 7 / 1 | 146 / 198 / 198 | 10,057 ms | 43 ms |
| Local prefix 1.8B, complete | 8 | 8 / 0 | 143 / 185 / 185 | 8,954 ms | 42 ms |
| Natural 7B, partial | 27 | 26 / 1 | 182 / 226 / 418 | 92,324 ms | 264 ms |
| Local prefix 7B, complete | 8 | 8 / 0 | 180 / 215 / 215 | 24,591 ms | 80 ms |

The journal's `elapsed_ms` includes the provider request path and response
processing; it is not an isolated network or model-only clock. The machine
report separates outcomes and retains null usage as null. Every observed chat
request still had four target slots and one count request, so the journal shows
no split chat request or extra count pass in these prefixes. The exact number
of context lines dropped is not stored and remains unknown.

## Stage durations in the corrected attempt

All spans below use a monotonic clock. Sums are for the named phase only;
`translation_execute` contains the HTTP and storage work. Do not add nested
spans to obtain wall time. A dash means that stage did not occur.

| Arm | CLI wall | Pre-launch model hash | Server spawn to ready | Durable model preflight | Translation execute | Chat request sum | Count request sum | Checkpoint commit sum | Result commit | Output write |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Natural 1.8B, partial | 18.585 s | — | 1.924 s external | 6.264 s | 11.387 s | 10.057 s | 0.043 s | 0.198 s | — | — |
| Local 1.8B, complete | 24.343 s | 5.209 s | 1.800 s owned | 6.362 s | 10.097 s | 8.954 s | 0.042 s | 0.247 s | 0.024 s | 0.049 s |
| Natural 7B, partial | 131.002 s | — | 4.546 s external | 23.298 s | 106.101 s | 92.324 s | 0.264 s | 0.636 s | — | — |
| Local 7B, complete | 83.608 s | 23.930 s | 4.646 s owned | 24.730 s | 29.188 s | 24.591 s | 0.080 s | 0.206 s | 0.024 s | 0.042 s |

The pre-launch hash is isolated. The durable preflight includes the second
model read, server verification and persistence, so it must not be called pure
hashing time. External server startup is outside CLI wall time. The journal
write spans are inside translation execution: for the partial natural 7B arm,
54 journal finishes summed to 11.288 s (p95 1.054 s, max 1.220 s). This is a
measured storage-path cost; its cause has not been isolated. Final result and
file-write times are available only from the completed local arms.

The 5-second resource sampler observed the external server process but did not
track the server child owned by `translate-local`. Device GPU usage also
includes other processes. Resource values in the machine report are sampled
lower bounds, not isolated model memory peaks. The runs are cold processes;
OS file-cache state was not controlled. No whole-file speedup or language
quality improvement is inferred from these unpaired durations.

## Checks and next decision

`task check`, `task test:cli:local`, `task test:cli:protocol`,
`task eval:timing:inventory`, `task eval:timing:probe` (first and corrected
attempts both exit 1 for the reasons above), `task eval:timing:publish` and
`task eval:timing:check` were run. The two data checks passed, including
re-reading the four old SQLite files and both new attempts and reconciling
every new SQLite hash, aggregate and timing record. `task plan:check`,
`task docs:check`, `task site:build` and `task site:check` passed after the
backlog update.

The next performance investigation should isolate why some 7B journal finish
operations take over one second and whether that cost persists under repeated
controlled runs. Startup is also substantial for short local files: the two
required model integrity checks dominate much of the 7B local wall time. Any
change to those checks needs a separate safety contract. The incomplete
natural translations remain a quality/recovery issue and do not close the
long-file or release gate.
