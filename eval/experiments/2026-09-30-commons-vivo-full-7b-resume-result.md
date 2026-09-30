# Vivo interview: copied-state 467-cue structural completion

Date: 30 September 2026. `task eval:natural:vivo:7b:resume` completed the [one declared copied-state continuation](2026-09-30-commons-vivo-resume-plan.md) after the retained [cue-276 model-output failure](2026-09-30-commons-vivo-full-7b-failure.md). The first preflight invocation had stopped before model inference on a transcribed SQLite hash typo; its report SHA-256 `1643c9a296a4b59e7751a4cf09fb2efb323355a357e1ca40dcd15f18a81cacac` remains private. The corrected invocation copied the closed source/state, relocated only the managed source locator in the copy, and verified the original SQLite SHA-256 `4ae076bbdfa11a55d8f0e251604621eb41fad91f16aea78915ce0f14966ce90f` unchanged. The same source, scene map, 7B Q4_K_M model SHA-256 `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`, v5 profile SHA-256 `9b34d86d3b0d872720ee729131efef99281e71a0000d202abea169d625a92e73`, release CLI SHA-256 `82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d` and llama.cpp SHA-256 `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4` were rechecked. No reference translation entered inference.

The new ignored workspace `.cache/eval/commons-vivo-full-7b-resume-v1/run-ndCw9w/` holds report SHA-256 `fd8c5b52e2cc229a052812cea353d0b8a0f1c555d773f5c7ffc67a9175808ebe`, the complete private Russian candidate SHA-256 `96f9c31d6feb22a4619ecc528f8c17313caea356103e65707f86904a783c31af`, raw requests/responses, resource samples, copied SQLite and byte-identical offline SRT export. The original 275 accepted checkpoints matched exactly after completion; the copy reached 467/467, one validated result and no protected cue/timing changes. The previously malformed cue 276 received a different valid sampled response in this sole continuation. The original invalid response and state remain untouched; the successful sample does not eliminate the model-output failure class.

| Measure | First attempt (failed at 276) | Copied-state continuation | Combined observation |
| --- | ---: | ---: | ---: |
| Chat completions | 276 | 192 | 468 |
| All instrumented HTTP calls | 831 | 579 | 1,410 |
| Prompt tokens | 75,287 | 53,019 | 128,306 |
| Completion tokens | 11,397 | 8,093 | 19,490 |
| Summed chat HTTP time | 204,055 ms | 167,731 ms | 371,786 ms |
| Translation command time | 471,802 ms | 766,802 ms | 1,238,604 ms |
| Whole diagnostic time | 498,021 ms | 795,433 ms | 1,293,454 ms |
| Sampled peak server working set | 5,073,354,752 B | 5,069,148,160 B | two separate peaks |
| Sampled whole-device GPU use | 5,748 MiB | 5,750 MiB | two separate peaks |

The summed times include different runs and are **not** a single uninterrupted throughput benchmark. Resource samples were roughly one per second on an active machine; whole-device GPU use includes other activity. The 467-cue candidate is structurally recoverable, but no human Chinese–Russian adequacy score, audio/source alignment, scene/speaker map, rights admission or complete-file language audit exists. An AI source-selected review sample is frozen separately; the candidate is **not** a selected spoken script or G1–G9 acceptance.
