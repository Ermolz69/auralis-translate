# REG-010: next-cue content in a valid target slot

Status: archived synthetic long-file failure confirmed; deterministic
clock-time warning implemented; model-side content isolation and human review
remain open. This is an `EVAL-04` and `CTX-02` development slice, not release
acceptance.

The immutable v6 1.8B Q4 run accepted cue 129 as `segment_id:129` while its
Russian text said `AUR-0130: Не открывайте эту дверь.` The Chinese target says
the train departs at `08:10`; the next supplied source-context cue warns not
to open the door. The original response used the correct JSON slot, so slot
validation did not catch the semantic substitution. The archived journal
retains raw request/response, 253 prompt tokens, 46 completion tokens and a
2,531 ms request. Four same-pattern train/door pairs at cues 1, 257, 513 and
769 retained the target time in the archived output. These are controls, not
independent language review.

The [REG-010 pack](../regressions/long-v6-neighbor-content-v1.json) pins the
archived report, journal, profile and five request hashes. It adds wrong-time,
duplicate-time, equivalent-hour, context-only, reordered-time and embedded-code
controls. The [clock-time diagnostic](../../docs/reference/source-clock-time-diagnostic-v1.md)
compares only target source and candidate lines. New runs store an advisory
`time_mismatch` with the checkpoint. No old checkpoint is modified, and the
existing model profile remains unchanged. An absent warning cannot establish
correct meaning.

## Bounded paired context screen, predeclared before execution

- Question: does removing the **next cue** from `source_context` prevent the
  observed target-content substitution without harming target time or code?
- Sources: the same five archived authored synthetic development cues
  `[1,129,257,513,769]`, with the v6 journal SHA in the pack. No sealed
  holdout or natural subtitle is used. Source interpretations are fixed above.
- Baseline: exact archived v6 request per cue with seed overridden. Changed
  arm: remove only the one next-cue entry from `source_context`; keep target,
  prompt preamble, response schema, decoding and model fixed. No Russian
  reference or accepted output enters either request.
- Model: Hy-MT2 1.8B Q4_K_M GGUF SHA
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`;
  llama-server SHA
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`;
  v6 profile SHA
  `b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5`.
  One local GPU server, 2048 context, 99 GPU layers, one parallel slot.
- Seeds `[101,202,303]`; per-seed cue order is fixed and arm order alternates
  by cue index. Thirty requests maximum, one server start, no retry,
  120-second request deadline, 20-minute total wall budget. Stop at any
  identity/input mismatch, budget exhaustion, or server failure while retaining
  all prior raw observations and resource samples.
- Record rendered request, raw response, candidate, slot validation, exact
  code/time, model usage, monotonic request duration, process and device memory.
  Compare each cue/seed pair with the same denominator. Structural and exact
  facts can be machine checked; adequacy remains unreviewed. If the baseline
  failure does not recur, do not adopt a global no-context policy from this
  small screen.

The experiment and all failures are retained under a new identity. A real
long-file run, independent Chinese/Russian review, scene cohesion, and final
release audit remain required.

## Implementation verification before model screen

- `task test:time-diagnostics`: 2 core and 1 SQLite reopen tests passed.
- `task eval:regression:catalog:check`: 10 pinned packs verified; v2 retained.
- `task eval:regression:check`: passed after a sandbox-only Node child-process
  `spawn EPERM` rerun with execution permission; REG-010 archive and all earlier
  regression checks passed.
- `task eval:reg010:context:check`: 30 paired planned requests passed identity,
  source/context mutation and no-reference preflight.
- `task fmt`, `task lint`, `task docs:check`, `task plan:check`: passed after
  applying repository formatting. These checks do not establish model quality.
