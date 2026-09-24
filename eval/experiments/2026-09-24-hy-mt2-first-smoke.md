# Hy-MT2 first local SRT smoke

Date: 24 September 2026. Status: **experimental feasibility evidence**, not a release-quality or bilingual-review pass.

## Materials and environment

| Item | Observed value |
| --- | --- |
| Input | Project-authored [plain SRT fixture](../../crates/auralis-translation-formats/tests/fixtures/plain.srt), two cues and three Chinese lines. |
| Source SHA-256 | `442d0fc3d1d94734c35f6d9b618bf2181e595b036672457e4d7cd7bdee561321` |
| Model | [Tencent Hy-MT2-1.8B-GGUF Q4_K_M](https://huggingface.co/tencent/Hy-MT2-1.8B-GGUF/blob/a0c709d9fac510f2c807aa3af52872340dc37a4a/Hy-MT2-1.8B-Q4_K_M.gguf), revision `a0c709d9fac510f2c807aa3af52872340dc37a4a`, SHA-256 `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`. Downloaded size 1,133,080,448 bytes; hash verified locally. |
| Runtime | [llama.cpp release b10977](https://github.com/ggml-org/llama.cpp/releases/tag/b10977), `llama-server --version`: `0.4.1-dev (build 10977, commit 0ecb159c9)`. Windows CUDA 12.4 runtime and binary archives verified against release SHA-256 `8c79a9b226de4b3cacfd1f83d24f962d0773be79f1e7b75c6af4ded7e32ae1d6` and `28d5a95c71cb1665ae9b42623abe90c512dc75e0cd6256fba926996c0137a764`. |
| Host | Windows NT 10.0.19045.0, NVIDIA GeForce RTX 3070 8,192 MiB, driver 595.79. GPU total memory observed at 3,026 MiB while the server was idle after translation; it included other desktop processes. |
| Runtime invocation | `llama-server.exe --model <verified GGUF> --alias auralis-hy-mt2-1.8b-q4 --host 127.0.0.1 --port 18080 -c 2048 -ngl 99 --jinja`, with CUDA DLL directory on `PATH`. |
| Application invocation | `task cli -- translate-experimental crates/auralis-translation-formats/tests/fixtures/plain.srt models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json http://127.0.0.1:18080/ .cache/smoke-ru.srt` |
| Prompt and decoding | Prompt version 1 sends one user message per source line, requesting Russian only. The [experimental profile](../../models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json) records temperature 0.7, top-p 0.6, top-k 20, repeat penalty 1.05, and a 256-token per-line ceiling. The basic prompt and sampling values are based on [Tencent's model card](https://huggingface.co/tencent/Hy-MT2-1.8B-GGUF). |

The model and runtime archives live only in ignored `.cache/` and are **not** committed. The model card says its GGUF route depends on an STQ kernel; this Q4 file loaded in the tested runtime, but other quantizations and builds have not been checked. The adapter uses the [llama.cpp chat completions endpoint](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md#post-v1chatcompletions-openai-compatible-chat-completions-api) and validates the returned text independently.

## Observed output

| Source | Russian output |
| --- | --- |
| `你好。` | `Здравствуйте.` |
| `明天见。` | `Увидимся завтра.` |
| `再见。` | `До свидания.` |

The output was saved to a separate SRT. Its SHA-256 was `69e12c8a904dc5456ecb8e50065c6476f60bb5656a8d318103027ed7e3a03c0`. Reinspection reported two cues, three text slots, the same labels and timings, and preserved protected chunks. The original fixture remained tracked and unchanged. The server reported no truncated request; its three per-line total computation times were 264.91 ms, 65.65 ms, and 53.24 ms. The CLI command took about 2.15 seconds including process startup. Those numbers are one warm-server run on a tiny fixture, not a throughput estimate.

## Open checks

- A bilingual reviewer has not approved even this tiny sample. No Chinese corpus or holdout evaluation has run.
- The CLI trusts the explicitly supplied local server alias; it does not yet prove that the server loaded the manifest's expected model hash or runtime build. Manual file and archive hash checks were performed for this run.
- The experimental provider translates each text line separately, discards no accepted output, and rejects incomplete responses, but it has no neighboring cue context, glossary, retries, cancellation, or checkpointing.
- The server emitted a tokenizer warning about `special_eos_id` not appearing in `special_eog_ids`. It did not stop this short run; investigate it before a release gate.
- The long-file, crash, pause/resume, memory, resource-contention, WebVTT, and Japanese gates remain open.
