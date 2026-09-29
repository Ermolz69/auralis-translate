# Target-slot JSON Schema ablation did not establish a fix

Status: bounded real-model development comparison for `CTX-02` and `REG-003`, 29 September 2026. The [plan](2026-09-29-slot-schema-ablation-plan.md) and Taskfile harness were committed as `ca9299d` before inference. The single run used the archived authored cue 72 with source-only context IDs 71/73, not a sealed holdout or natural scene. The expected meaning stayed outside all requests.

`task eval:slot-schema:probe` first checked the earlier 269-request failure journal, built the CLI and passed `doctor` for Hy-MT2 1.8B Q4_K_M SHA-256 `dc5f44fc...c06699`. The pinned llama.cpp executable SHA-256 was `6f15be27...37b2f4`. One server handled exactly four chat requests within the declared ten-minute budget, 2 seeds × 2 arms. The baseline replayed the archived request with a paired seed; the other arm only replaced the two response-schema properties with `const:72` and `const:0`. The raw [report](../reports/2026-09-29-slot-schema-ablation.json) has SHA-256 `7a53c67769e59cee113aea10fc25b4e04f77acc6aadd4d9b1fb918fe6d4473d5`, including complete request/response bodies, candidates, usage, timings, identity, failure array and resource sample. `task eval:slot-schema:check` verifies the report and exact paired difference.

| Seed | Baseline ID / text | Constant-schema ID / text | Prompt / completion tokens per arm |
| --- | --- | --- | --- |
| 101 | 72 / «Это не последний поезд.» | 72 / «Это не последний поезд.» | 290 / 30 |
| 202 | 72 / «Это не последний поезд.» | 72 / «Это не последний поезд.» | 290 / 30 |

Both arms were structurally accepted in both pairs, with no HTTP or parse failure. The four measured chat walls were 387, 326, 259 and 266 ms in request order; the complete harness wall was 8.97 s. A single process sample recorded a 1,547,436,032-byte server working set and device-wide RTX 3070 memory use of 2,201 MiB. These are neither isolated peaks nor a long-run SLA. The archived original unseeded request returned ID 73 and remains the confirmed failure; the two new baseline seeds did not reproduce it. Therefore this experiment does **not** show a reliability improvement or justify changing the production prompt profile. It says only that the pinned server accepted the constant schema and returned valid JSON in these four calls. The Russian line was not assessed by a bilingual reviewer.

No production v5 profile, checkpoint or original subtitle changed. `REG-003` remains open and the failed 1,024-cue run remains failed. A future fix must be versioned separately, preserve strict rejection, and pass a wider, predeclared scene/seam comparison with source-aware review rather than relying on this four-call structural screen.
