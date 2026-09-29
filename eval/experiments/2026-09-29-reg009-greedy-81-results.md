# REG-009 matched 81-request greedy screen: retained result

The [predeclared plan](2026-09-29-reg009-greedy-81-plan.md) and runner were
committed as `89dca653` before inference. One checked Hy-MT2 1.8B Q4_K_M
server ran the exact 27 synthetic beginning/seam/middle/end cue prompts
from the archived temperature-0.7 screen, three seeds each, with only the
request temperature changed to zero. The ordered request-hash aggregate was
`230b44cb198e330b96fd2880bc4442ca8ac92e73138a854867b90084b2d42c36`.
The historical prompt, model, runtime, source, request and response identities
are checked in the [archive verifier](../scripts/capture-reg009-greedy81.mjs).
No Russian reference, old response or sealed holdout was supplied to the model.

The one run made 81 calls, no retries, with 81/81 parsed target slots,
zero HTTP/transport/resource errors and a 232,247 ms wall time. The ignored
raw workspace is `.cache/eval/reg009-greedy81/run-fjidrT`. The immutable
[summary](../reports/2026-09-29-reg009-greedy81-summary.json) and
[full archive](../reports/2026-09-29-reg009-greedy81-archive.json.gz)
retain every request, HTTP body, raw candidate, tokens/timings, server log
and sampled memory. Archive SHA-256 is
`da0617c86ccf7ef7cbab3dcbeb30a36ae2dce650696623f6f9477a6749bc0b2b`.

| Same 27 cues × 3 seeds | Archived 0.7 | New greedy |
| --- | ---: | ---: |
| Raw exact ASCII source code | 36/81 | 36/81 |
| Exact numeric-token multiset | 81/81 | 81/81 |
| Parsed target slot | 81/81 | 81/81 |

Six code outcomes improved and six regressed. Both arms were exact in 30
pairs and both missed in 39. Wording changed in 27 paired requests. Each
greedy cue had **one unique output across its three seeds**, so 81 attempts
do not represent 81 independent greedy translations. The 0.7 historical
screen used the same seed/cue pairs; the comparison remains development-only
and source-correlated. The single-cue REG-014 temperature-0 screen had 3/3
exact codes but did not predict this multi-position result.

AI source-aware triage: cue 3 at seeds 101/202 and cue 1019 at seed 202
changed the source first person `我们` from `Им` to `Нам`, fixing the prior
[REG-012](../regressions/long-v6-first-person-loss-v1.json) observation in
these pairs. Cue 510 became `Система уже выключена, необходимо перезапускать
не нужно.` in **all three** greedy requests, although the three historical
answers for the same source did not use this awkward construction. That
recurs from [REG-013](../regressions/long-v6-restart-grammar-v1.json) and is
recorded as a decoding-specific [REG-017](../regressions/greedy-restart-grammar-v1.json)
with related same-source cue 6/1022 and negative controls. Cue 1022 changed
in the opposite direction to a clearer no-restart sentence. These mixed
effects reject a global greedy-profile promotion. Prefix projection can
insert a missing code with a review flag, but cannot repair the cue-510
Russian sentence. Cue 129 kept the target time/code and did not reproduce
its prior wrong-content substitution; it remains an open regression. The
synthetic `车` can mean vehicle, bus or train by context, so the cue-512
train/bus switch is not scored as a source error without adjudication.

New responses used 23,859 prompt and 3,390 completion tokens; summed
request time was 206,967 ms. The historical arm used 23,859 and 3,385
tokens and 210,622 ms summed request time. Cache warmth and ambient load
prevent a speed claim. Forty-six five-second resource samples had no errors;
tracked working-set peak was 2,107,613,184 bytes, tracked private-memory
peak 1,062,535,168 bytes and device-wide GPU memory peak 1,037 MiB. The GPU
figure includes other processes and does not show isolated offload.

Human Chinese/Russian adequacy and fluency review is missing. This direct
HTTP screen does not verify SQLite checkpointing, v3 strict-time acceptance,
full-file completion, a natural source, or release G1–G9. Temperature zero
remains unselected. `task eval:reg009:greedy81:preflight`,
`task eval:reg009:greedy81:probe`, `task eval:reg009:greedy81:capture`,
`task eval:reg009:greedy81:check` and
`task eval:reg009:greedy81:inspect` completed successfully.
`task eval:regression:catalog:check`, `task eval:regression:check`,
`task docs:check`, `task plan:check`, `task site:build` and
`task site:check` passed after the evidence and public section were added.
