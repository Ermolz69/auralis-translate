# Bounded real-model v7 batch screen

Date: 2 October 2026. Task: partial `LONG-01`. This is an authored
development fixture, not a natural or held-out quality gate. The question is
whether the checked 1.8B llama.cpp runtime can accept and durably journal v7
batch sizes 1 and 4 on the same four Chinese cues, and what the raw request,
token, time and memory differences are. The compared factor is batch size.

Source: `eval/corpora/v7-batch-development-v1.zh.srt`, one declared scene,
four targets. Expected meaning for later AI editorial inspection: Wang says
tomorrow is not Friday; a ticket costs ten yuan and one must not pay one hundred;
Xiao Li may have handed the key to Wang; he did not and left it on the table.
These expectations and any resulting Russian text are excluded from prompts.
No independent reviewer exists. This fixture belongs to development only and
must never be treated as release holdout or independent reference.

Model: pinned `tencent/Hy-MT2-1.8B-GGUF` Q4_K_M, SHA
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
Runtime: local llama.cpp `b10977-0ecb159c9`, SHA
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
Prompt: checked v7 template and manifest identities at execution. One 2048-token
server, GPU offload request 99 layers, one parallel slot, Jinja, no RAM cache;
record actual backend from server diagnostics. No glossary. Decoding is fixed by
the v7 manifest; no seed override, so this single screen is not a stable latency
benchmark. Run order: size 1 then size 4, fresh SQLite state per arm, same server.
The source-only one-cue scene windows follow the profile. Each arm may generate
up to four chat requests; at most eight total, 120 seconds each and 10 minutes
total including startup. No automatic retries. Retain failures, raw outputs,
rendered requests, accepted outputs and checkpoint state in private per-run data.
Public summary contains hashes and aggregate observations only. Stop on timeout,
model mismatch or any failed run. Structural success does not establish semantic
accuracy, gain from batching, long-file readiness or release quality.

Command: `task eval:long:v7:authored:preflight`, then
`task eval:long:v7:authored:probe`. Preserve both attempt directories.

Amendment after the first real attempt: the sandbox could not spawn its child
process; its report is retained. The permitted attempt then stopped on its
second chat after one structurally accepted but semantically wrong first cue.
The source context's ticket price was copied into the nonmonetary Wang target.
The response for the money target omitted its protected tokens. The new v7
currency-invention guard changes the template hash identity and has a
deterministic reproduction with neighboring money and nonmoney controls.
Run **one** more attempt under the same eight-chat/ten-minute bound to confirm
the guard prevents acceptance of the first failure. This amendment was made
before the new real request. Do not expand the trial if it fails again.
