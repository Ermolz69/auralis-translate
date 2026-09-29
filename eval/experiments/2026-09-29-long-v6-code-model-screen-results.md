# Long v6 exact-fact model screen: retained result

Status: completed `EVAL-04` development screen; `DECIDE-01` remains planned.
This is the result of the [committed predeclaration](2026-09-29-long-v6-code-model-screen-plan.md).
Neither model is selected for release. The source is a project-authored,
repetitive synthetic file, not a natural Chinese subtitle or sealed holdout.
No bilingual human has reviewed these outputs.

The frozen source journal SHA-256 was
`4037c071a17ef38ed7b9bc4989601ef8da0784fb39881b9138abb9d008701a8c`.
The 1.8B/7B GGUF SHA-256 values were respectively
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`
and `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`.
Both used v6 prompt template SHA-256
`137efcbd09400d7ad2ab6c257077f96e09d7ff0c2eac2a35c067cdcbd7ef6a18`
and llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The pinned committed harness was `650ef982fbeca8de75bb3fcbcf7274c1c18db970`.
The sole dirty path at execution was the owner's unrelated architecture document.

`task eval:long:v6:code-model:probe` completed 162/162 requests without retry,
transport or structural failure, from 11:46:45 to 12:06:22 UTC on 29 September
2026 (1,177,096 ms wall time, within the 25-minute budget). Each of 27 frozen
beginning, seam and end cue IDs was tested with seeds 101/202/303 on each model.
Only the model alias changed in each pair; the harness verifies the complete
rendered request, raw response, target/context slots and no-reference prompt.

| Measure | 1.8B Q4 | 7B Q4 |
| --- | ---: | ---: |
| Structurally valid target slots | 81/81 | 81/81 |
| Exact source identifier | 36/81 | 73/81 |
| Exact numeric facts | 81/81 | 81/81 |
| Prompt / completion tokens | 23,859 / 3,385 | 25,467 / 3,823 |
| Request time p50 / p95 | 2,590 / 3,091 ms | 11,649 / 13,058 ms |
| Sum of request times | 211,136 ms | 916,336 ms |
| Peak sampled tracked working set | 2,113,560,576 bytes | 8,400,084,992 bytes |
| Peak sampled tracked private memory | 1,068,523,520 bytes | 3,918,893,056 bytes |

On the 81 matched pairs, 7B preserved the code in 38 pairs where 1.8B did
not, lost it in one pair where 1.8B kept it, and matched in 42. That one
regression was cue 1020 seed 303: 7B omitted `AUR-1020` while 1.8B retained
it. The device-wide GPU peaks were 859 and 855 MiB respectively and include
other applications; they do not establish isolated GPU memory or offload.
The RAM values are sampled process observations, not a clean-machine limit.

## Source-aware AI inspection, separate from human judgment

The Chinese `这扇门` denotes one door. For the four matching source cues
2, 130, 506 and 1018, all three 7B seeds produced the plural `эти двери`
(12/12). All 12 matched 1.8B answers used singular `эту дверь`. This is a
confirmed meaning/number failure in the 7B sample despite its code gains,
recorded as [REG-011](../regressions/long-v6-singular-door-v1.json).
At cue 506 seeds 202/303, 7B also shortened `AUR-0506` to `AUR-506`.
This review is source-aware AI inspection of a narrow repeated template;
it is not an independent bilingual rating or proof of general model quality.

The [summary](../reports/2026-09-29-long-v6-code-model-screen-summary.json),
[full report](../reports/2026-09-29-long-v6-code-model-screen-report.json),
[162 raw requests and responses](../reports/2026-09-29-long-v6-code-model-screen-requests.jsonl.gz),
[1.8B resource samples](../reports/2026-09-29-long-v6-code-model-screen-1b-resources.jsonl.gz)
and [7B resource samples](../reports/2026-09-29-long-v6-code-model-screen-7b-resources.jsonl.gz)
retain failures, tokens, request times and sampled resources. The raw journal
SHA-256 is `0288327d57f37b093996e4ba4f3e3b499b68286cca00f9af13fdb3f708839bc6`.
`task eval:long:v6:code-model:result:check` verifies every archived request
and same-source pair. Complete natural long-file quality, scene continuity,
speaker/name/fact adequacy, hardware acceptance and human review remain open.

## Verification and disposition

`task eval:long:v6:code-model:capture
REPORT_DIR=.cache/eval/long-v6-code-model-screen/run-1o7Vka` retained the
bounded output. `task eval:long:v6:code-model:result:check` passed on 162
request/response pairs and both resource journals. `task eval:regression:check`
passed after REG-011 was included: 11 versioned packs, all archived model
attempts and the relevant Rust guard/checkpoint tests passed. `task site:build`,
`task site:check`, `task docs:check` and `task plan:check` passed after the
report and backlog update. These are evidence-integrity and engineering
checks, not translation acceptance.

The release candidate remains unselected. To roll back this evaluation-only
slice, revert its report, catalog, checker, Taskfile and site commits; keep the
predeclared plan and raw archives for audit. No production model/profile or
translation checkpoint was changed by this screen.

## Publication verification

The checked Pages source was committed as `30cc2b6de795e8b8e04d4a0396ceccea026e76b4`.
[Pages run 36567172077](https://github.com/Ermolz69/auralis-translate/actions/runs/36567172077)
completed successfully. The [published report](https://ermolz69.github.io/auralis-translate/)
returned HTTP 200 and 953,774 bytes; its SHA-256 matched `site/index.html`
exactly at `0e481caba354294d5e5675e74a83af655cb3ab47fcd2c0beb3f7da09f0c7b3e9`.
The fetched page contained the new long-v6 model section and the Tailwind CDN
script. Earlier measurements remain in the same single-file report.
