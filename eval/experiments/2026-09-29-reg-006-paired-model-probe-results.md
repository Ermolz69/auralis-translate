# Matched 1.8B/7B v6 screen on the length-failure source

Status: completed **development observations**, 29 September 2026; no model or long-file acceptance. The [plan](2026-09-29-reg-006-paired-model-probe-plan.md), checked 7B v6 manifest and source-only controls were committed at `6264d27` before inference. `task eval:long:v6:length:model-probe` passed the archived regression gate, `test:context-v6`, `build:release`, and `doctor` on both pinned models, then made exactly **16/16 planned** chat requests (four authored Chinese target variants × seeds 101/202 × two models). Both servers ran serially. The two requests for each case/seed differed only in the checked model alias; model-specific tokenization still gave different prompt-token counts. Each response and request was synced before the next; no reference sense entered a prompt. The run finished in 108,486 ms from workspace start without a request failure.

The [summary](../reports/2026-09-29-reg-006-paired-model-probe.json), SHA-256 `f1d9f31f99a0f986e8cbb39566dbf5cb63b3004d72f3eb85c711743c80eafc4d`, links to the complete [run report](../reports/2026-09-29-reg-006-paired-model-probe-report.json), SHA-256 `45fb210494e254ccd2e61b4c125abadccfe4f2ce489e6f160cc0de6d073f8bd8`, [raw request/response JSONL](../reports/2026-09-29-reg-006-paired-model-probe-requests.jsonl.gz), SHA-256 `8db3b4a924bbe2fe54693415914b945781f74ea960e9caed93df4848c52fe083`, and [server logs](../reports/2026-09-29-reg-006-paired-model-probe-server-logs.json.gz), SHA-256 `e56084adb30142752ca7186acc99bee1c13430220e7973ef5330adf5a45724c6`. `task eval:long:v6:length:check` verifies these archives, all 16 raw answers, source-only prompts, matched bodies and resource samples without the models or private workspace.

| Measured quantity | 1.8B Q4_K_M | 7B Q4_K_M |
| --- | ---: | ---: |
| Structurally valid JSON / planned chats | 8/8 | 8/8 |
| Recorded prompt / completion tokens | 2,508 / 373 | 2,688 / 436 |
| Sum of per-request elapsed time | 18,643 ms | 76,745 ms |
| Median request time (range) | 2,272.5 ms (1,851–3,577) | 8,608 ms (8,159–16,757) |
| Peak tracked server working set | 2,107,453,440 bytes | 8,413,245,440 bytes |
| Peak tracked private memory | 1,058,947,072 bytes | 3,911,950,336 bytes |
| Peak device-wide GPU reading | 826 MiB | 828 MiB |

The resource series have 4 and 17 samples respectively, with zero sampler errors. Device-wide GPU readings include other applications and do **not** establish GPU layer offload. The 7B working set is materially larger on this host; no clean-target throughput or memory gate follows from this short API screen.

Assistant source-aware inspection, **not bilingual human scoring**: for the original Amin/tomorrow source, both models produced plausible meeting-delay wording in these two seeds. The earlier archived 1.8B response on this same source had repeated corrupted JSON until its 256-token cap. Therefore the new 2/2 1.8B successes do not erase `REG-006` or estimate failure probability. For the explicit-today negative control, both 1.8B candidates omitted `сегодня`, while both 7B candidates retained it; [REG-007](../regressions/long-v6-today-omission-v1.json) freezes that fact loss and two related plus one date-free control. Both 1.8B A Hua candidates rendered the name as `Авха`, which needs reviewer adjudication against `阿华`; 7B rendered `А Хуа`. On the day-after control, 7B used `позавтра` in both seeds, a wording flagged for a Russian editor; 1.8B used `послезавтра`. No lexicographic or human acceptability verdict is claimed.

This synthetic, inspected development source is not a sealed holdout. Eight valid JSON responses per model are too few to choose a release model or conclude 7B solves the long-file failure. The existing v6 run remains failed at 982/1,024 checkpoints, with no full Russian SRT. A future candidate needs predeclared full-file and natural-scene comparisons, assistant and independent bilingual assessments kept separate, and the audio pilot must use an approved script. The desktop and G3–G9/A1–A6 release gates remain open.
