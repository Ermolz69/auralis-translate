# Real paired v5 inference journal result

Date: 29 September 2026 local (+03:00), 28 September UTC. Task: `CTX-02`
(partial). The [predeclared plan](2026-09-29-inference-journal-paired-plan.md)
fixed the source, model, two arms, order and budget before inference. The
committed harness identity was `25b48b1`; the optimized CLI SHA-256 was
`dcf51e2157a5f6ec9aaba1eee2e163f4228415b80d47c994cc23e54c74d84c42`.
Model, profile and runtime hashes are in the [raw report](../reports/inference-journal-paired-2026-09-29.json).

The first `task eval:journal:paired` invocation failed at Node process spawn
with sandbox `EPERM` before model verification or server launch. No HTTP or
model request ran. Its [failure record](../reports/inference-journal-sandbox-failure-2026-09-29.json)
is retained. The same Taskfile command then completed with authorized local
process access; no budget, source or profile changed.

Both arms translated the same complete authored three-cue SRT:
`哥哥刚下车。` → `到了。` → `门开了。`. Baseline rendered the target as
`Пришло.`; scene context rendered `Приехали.`. Each arm made three model
chats, with one pass and no generation retries. The scene output still uses
plural for an explicitly singular older brother. This is an AI source-aware
observation, not an independent bilingual judgment or an adequacy score.
The proposed reference was retained outside every request.

The completed run had 18 loopback calls, including 6 model chats, 3 template
renders, 3 tokenizer calls and 6 preparation probes. Baseline used 561 prompt
and 95 completion tokens across three chats; scene context used 681 prompt
and 93 completion tokens. Summed proxy chat durations were 2,649.7 and
2,313.1 ms, respectively. Complete CLI file walls were 10,239.5 and
9,553.5 ms; this one repetition cannot establish a speed difference.
All original protected bytes were preserved, both results had three accepted
blocks, and offline re-export after runtime shutdown was byte-identical.

The [journal check](../reports/inference-journal-paired-check-2026-09-29.json)
matched all 6 actual chat requests to durable rows by exact request hash,
rendered body, raw response bytes, prompt/completion usage and accepted
target text. It found no missing or pending chat row. The [raw report](../reports/inference-journal-paired-2026-09-29.json)
SHA-256 is `7877cbbe8f2ddf286cb3848de3a8315fb0977ced7b9444123a258f8041e1a5a4`.
Both reports are retained; SQLite databases and source/output copies remain
under `.cache/eval/inference-journal-paired-v1/run-bsPEPL` on the test host.

The resource sampler recorded 26 approximately one-second samples. Its
working-set peak was 2,179,371,008 bytes and the peak **whole-device** GPU
memory reading was 7,725 MiB. Sampling gives approximate lower bounds;
device memory includes other processes. The run used the checked local
llama.cpp build `b10977-0ecb159c9` with a 2,048-token context and RTX 3070
8,192 MiB device. The journal currently covers chat inference in the CLI;
template/tokenizer preflights and the Auralis host worker are still open.

`task eval:journal:paired` passed on the authorized rerun. This confirms
real-runtime trace integrity on a short authored source. It does not satisfy
natural long-file quality, human review, installation or any audio gate.
