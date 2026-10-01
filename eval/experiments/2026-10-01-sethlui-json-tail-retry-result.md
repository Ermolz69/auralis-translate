# 7B JSON-tail retry screen stopped on a length-limit variant

Date: 1 October 2026. Follows the [frozen plan](2026-10-01-sethlui-json-tail-retry-plan.md).
The experiment used the same private 263-cue Chinese restaurant source and the
same 7B Q4_K_M model, runtime, v6 prompt, schema and decoding parameters as
the archived [first full-file comparison](2026-10-01-sethlui-full-v6-model-comparison-result.md).
The changed manifest allowed one retry when a completed target JSON response
contained the exact leaked `」}]}` suffix. This is a development result with
zero independent bilingual reviews and no approved translation or audio script.

`task eval:natural:sethlui:v6:7b:tail-retry:preflight` passed before inference.
The source, model, runtime, manifest, release CLI and source-tree receipt
matched the plan. The private report SHA-256 is
`2f98318d0480bf9af354250175d74a85b51604a4c97f36bdeb25587fcba580b7`
at `.cache/eval/commons-sethlui-json-tail-retry-7b-v1/run-VmeFjB/report.json`.
The SQLite SHA-256 is
`1bf69fd8f20b6842a80b06fcc95e09e0e8583cd9b8956461c4f367220ca85d89`.
Run ID: `778a29df-1721-41bd-bbf9-4fe338dd41b7`.

| Observed measure | Result |
| --- | ---: |
| Source cues / saved checkpoints / published results | 263 / 61 / 0 |
| Chat / tokenizer / template / all HTTP requests | 62 / 62 / 62 / 189 |
| Retried cues | 0 |
| Prompt / completion tokens | 16,248 / 2,473 |
| Summed chat HTTP / translation command | 44.708 / 82.497 s |
| Doctor | 22.419 s |
| Peak sampled server working set / whole-device GPU use | 5,097,218,048 B / 6,988 MiB |
| Resource samples | 85 |
| Terminal cue | 62, `finish_reason=length` |

The request at cue 62 had the exact SHA-256
`3d0abf06162144d4b64da48633340020c2670b7b08904747b3252d434a9a1e7c`
seen in the archived v6 run. Its raw content began with the same Chinese-to-
Russian translation fragment and `」}]}` marker, then repeated closing braces
and brackets until the 256-token limit. The full raw candidate SHA-256 is
`31ebfdf60d78aaf815435d185d8c69c055f07c96cc3827bb1e3316b2b07439ae`;
the raw response and `invalid_candidate` outcome remain in the SQLite
inference journal. The provider correctly rejected an unfinished response
before the completed-JSON text-tail classifier ran. Thus the new opt-in rule
was not exercised by this real run; it did not solve this variant. A fresh
run after a measured revision needs a new experiment identity. No partial SRT
exists, and the 61 preceding checkpoints remain durable.

The first 61 requests matched the archived 7B request hashes. Source-aware AI
inspection of the same cue IDs found the name at cue 11 and approximate 50
staff at cue 22 retained, while cue 32 still described a dim sum specialist
as a dessert specialist. The archived 7B run stopped at cue 62 with a shorter,
completed JSON answer containing the leaked suffix. The copied continuation
then stopped at cue 100. These are stochastic response differences under the
same request, not evidence of a model-quality improvement. No beginning-to-
end quality score or scene-coherence claim follows from a 61-cue prefix.

`task eval:natural:sethlui:v6:7b:tail-retry:result:check` passed: it reconciled
the report hash, all 62 raw chats and preflights, token counts, source slots,
SQLite journal, contiguous checkpoint prefix and absence of an output file.
The public [summary](../reports/2026-10-01-sethlui-json-tail-retry-summary.json)
omits private subtitle text. The next regression must cover a length-limited
closer loop separately, keep ordinary length-limit responses permanent, and
verify that neither mode can save a partial answer. Human review, licensed
Chinese-speech material and G1–G9/A1–A6 remain open.
