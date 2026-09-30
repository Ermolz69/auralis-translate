# Archived ASUS v6 rendered-token budget audit result

Date: 1 October 2026. Partial `LONG-01` evidence under the
[predeclared archival plan](2026-10-01-asus-v6-token-budget-audit-plan.md).
The plan, verifier and Taskfile command were committed as Translate
`2d000dc` before the sole archival measurement. No model, server or
network request was made. The prior 268-cue translation, source SRT,
SQLite checkpoints and candidate remain unchanged.

`task eval:long:asus:v6:tokens:private` passed. Its prerequisite
reverified 268 raw target-bound replies, 268 ordered checkpoints, one
review-needed result and the byte-identical offline SRT. The audit paired
all 268 ordered `/apply-template` → `/tokenize` → chat triples, required
identical prompt messages and reply schemas, and found exact agreement
between each tokenizer count and the corresponding server
`usage.prompt_tokens`. It also verified each single target ID, line index,
adjacent same-scene context and the 256-token request output reserve.

| Actual rendered prompt tokens | Observation |
| --- | ---: |
| Minimum | 227 |
| Median, nearest rank | 276 |
| 95th percentile, nearest rank | 288 |
| Maximum | 300 (cue 81) |
| Ceiling after 256 response + 64 safety reserve from 2,048 | 1,728 |
| Minimum headroom to that ceiling | 1,428 |
| Context cues removed by budget policy | 0 |
| Sum over 268 chats | 73,766 prompt; 12,155 completion |

Boundary checks retained cue IDs 1, 2, 133, 134, 267 and 268 in the
private summary. First/last cues had one adjacent context cue; the other
four had two. No target used the farthest-context removal path in this
natural file. The machine-readable private report is
`.cache/eval/asus-v6-token-budget-audit-v1/report.json`, SHA-256
`fd992a84395c1484744a1e9e5a87043b17435728c094089f746a6931c7c6c1b0`.
It contains counts and IDs but no subtitle text or raw responses. The
same verified source-free bytes were copied with
`task eval:long:asus:v6:tokens:capture` to
[`eval/reports/asus-v6-token-budget-audit-v1.json`](../reports/asus-v6-token-budget-audit-v1.json)
for public reporting; the capture rejects changed bytes. The
underlying source and raw-run report SHA-256 values are respectively
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`
and `1d8addf0860cb88f0161ac6eeed3fc45351ab9912aaf0eff2b39a76772a26413`.

The observed wide headroom applies only to this one 1.8B v6 profile,
one-slot requests and these 268 source lines. It does not justify
automatically increasing context or batching targets: the same retained
translation has major semantic/factual defects under AI source-aware
triage, no independent bilingual score, and no accepted spoken script.
Multi-target request mapping, longer source distributions, 4,096-token
memory behavior and release SLA remain open. The prior real-run timing
and resource values remain in the [original result](2026-09-30-commons-asus-full-v6-slot-result.md);
this archival pass did not measure new inference speed or memory.
