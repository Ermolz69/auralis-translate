# V5 long-scene recovery stopped on neighbor slot ID

Status: failed real-model development attempt and open `REG-003`, 29 September
2026. This is partial engineering evidence for `CTX-02`, `LONG-01`, `LONG-03`
and `EVAL-04`, not a completed soak or a translation quality score. The
[predeclared plan](2026-09-29-long-v5-scene-plan.md) was committed as
`88858ad` before inference. Its one exploratory attempt and 30-minute budget
were not expanded after failure.

`task eval:cli:long:v5:scene` used the checked 1.8B Q4_K_M GGUF
`dc5f44fc...c06699`, v5 scene profile
`432a1b06...6968df4d`, llama.cpp build `b10977-0ecb159c9`, requested
99 GPU layers, one server slot and explicit zero MiB RAM cache. The
project-authored 1,024-cue SRT contains 1,280 text slots and eight declared
128-cue scenes; it is repetitive synthetic development material, without a
human Russian reference or holdout status. The standalone fixture manifest
is SHA-256 `0527cab3...4c43986`, generated source SRT
`e9b760bd...8391bb3` and scene map `2b98f91b...5d593680`.
The Russian draft reference remained outside every model request.

The sandboxed task invocation first stopped at Node test-worker creation
(`spawn EPERM`) before inference. The permitted retry ran the same plan.
`task eval:load:checks` passed 3 fixture/journal and 2 process tests;
`task test:long-scene-plan` passed its 1,024/4,096/10,000 target planner
control; `task build:release` built the CLI; the Taskfile `doctor` verified
the exact 1,133,080,448-byte model digest. The harness inspected all 1,024
source cues. It stopped the CLI after 16 saved blocks, found no result or
output file, restarted the server and rejected a changed profile before
resuming the same run ID `75a482ee-3aee-41e1-b460-af192026f209`.

The resumed run preserved those 16 checkpoints exactly and saved through
block 71/1,024. At cue 72, line 0, it supplied Chinese target
`工程 AUR-0072：这不是最后一班车。` with context cue IDs 71 and 73.
The raw model content was
`{"translations":[{"line_index":0,"segment_id":73,"text":"Это не последний поезд."}]}`.
The text resembles a translation of cue 72 but names the following context
cue. The strict v5 boundary rejected it as `invalid_candidate`; no silent
ID rewrite, automatic candidate retry or partial SRT occurred. The run state
is `failed`, with 71 durable checkpoints and zero results. This is a real
model reliability failure, not proof that the validator is broken or that
the Russian wording is good. Completion at 1,024 cues remains open.

The full SQLite-derived [journal](../reports/2026-09-29-long-v5-scene-failure-journal.json.gz)
(SHA-256 `ea54a978...ebc58`) retains all 269 attempts: 90 successful
`apply_template`, 89 successful `tokenize`, 88 validated chat responses, one
invalid chat response and one pending tokenizer request left by the forced
kill. The [summary](../reports/2026-09-29-long-v5-scene-failure.json)
(SHA-256 `3861cf3b...3d218d`) preserves the failed target, source context,
raw HTTP response, 290 prompt/33 completion tokens, 2,183 ms chat time,
profile/source hashes and absence of a partial publication. The ignored
local workspace retains SQLite, originals, first/second server logs and 55
resource samples. Their sampled interval is 05:05:40–05:10:11 UTC; peak
tracked process working set is 2,114,252,800 bytes. The sampled device GPU
field peaks at 767 MiB and includes other activity; neither value is a
model-exclusive hardware or full-run SLA claim.

`REG-003` now reproduces the next-context ID 73 response with the same
source/target/context structure. Related controls reject previous-context
ID 71 and wrong line index 1. The negative control accepts target ID 72,
line 0 structurally with the same text. `task test:context-v5` passed 14
provider/context tests, 9 profile contract tests and 2 CLI admission tests;
the new test also verifies the rejected raw candidate remains journaled.
`task eval:cli:long:v5:failure-check` checks archived request hashes and
source mapping without a model. No new model run or inference variant was
attempted after this failure.

The next long-file variant needs its own frozen prompt/model identity and
budget. A genuine natural-file gate additionally needs licensed Chinese
source, independent Chinese/Russian review, seam/scene coverage and a full
completed file. The retained failure is published so later attempts cannot
erase it.
