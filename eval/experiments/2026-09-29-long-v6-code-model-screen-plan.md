# Long v6 exact-fact 1.8B/7B screen, predeclared plan

Status: planned `EVAL-04`/`DECIDE-01` development screen, not model selection
or release acceptance. This plan and the Taskfile harness must be committed
before the first inference request. The comparison tests whether a larger
model materially reduces the exact-code and numeric-fact failures visible in
the existing long synthetic file. It cannot establish natural narrative
quality or independent language adequacy.

## Source and split

The immutable archived v6 1,024-cue synthetic SRT journal SHA-256 is
`4037c071a17ef38ed7b9bc4989601ef8da0784fb39881b9138abb9d008701a8c`.
Use target line zero at 27 frozen cue IDs:
`1–8, 129–130, 505–513, 1017–1024`. This covers beginning, a confirmed
next-cue substitution, a middle scene seam and the final eight cues. There
are only eight repeated source templates (train time, door prohibition,
three boxes, 21-degree temperature, Friday deadline, stopped device/no
restart, Amin/tomorrow, not-last-train). Repetition and line-zero sampling
are explicit limitations. The source family is project-authored synthetic
development, not sealed holdout; no Russian reference enters any request.

## One-factor comparison and resource budget

For each archived request, preserve the complete v6 prompt, target/context
slots, response schema and decoding values. Add seed 101, 202 or 303 and
change only `model` alias between the pinned 1.8B and 7B profiles. The
respective GGUF SHA-256 values are
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`
and `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`;
both use prompt template SHA-256
`137efcbd09400d7ad2ab6c257077f96e09d7ff0c2eac2a35c067cdcbd7ef6a18`
and llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The models run serially, 1.8B then 7B, on the local Windows RTX 3070
(8,192 MiB; 837 MiB in use before the screen). Server settings: 2,048
context, 99 requested GPU layers, one parallel slot, Jinja, cache-ram zero.
Two server starts and **162 chat requests maximum** (27 × 3 × 2), with no
retry, 120 seconds/request and a 25-minute total wall limit. Stop if the
total budget expires, identity/input validation fails or the server cannot
start; retain completed requests and samples. Record every HTTP/structural
failure without silently replacing its model, seed or answer.

Archive rendered request, raw response, restored/accepted candidate, exact
ASCII identifier and source numeric-token multisets, token usage, monotonic
request time, process working/private memory and device-wide GPU samples.
Numeric parsing excludes project codes and normalizes `8:10`/`08:10`; it is
only a narrow exact-fact screen. Review meaning/negation/names separately
with source-aware AI notes and later blind human judgment. Report each model
on the **same 81 cue/seed pairs**, including invalid responses, with no
exclusions. A shorter or less accurate 7B result is retained. Do not choose
the release model or start training/precision work from these synthetic
samples alone. In particular, neither a green short screen nor a failed
screen replaces a complete natural long-file review.
