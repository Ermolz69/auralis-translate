# First glossary-profile real-model smoke

Date: 24 September 2026. This is a structural and terminology-warning experiment for prompt version 3. It is not a language-quality or glossary-adherence gate.

## Setup

- Windows 10, RTX 3070, locally cached Tencent Hy-MT2-1.8B-GGUF Q4_K_M, llama.cpp b10977 CUDA runtime, as in the [first model smoke](2026-09-24-hy-mt2-first-smoke.md).
- `task cli -- doctor models/manifests/hy_mt2_1_8b_q4_k_m.glossary.experimental.json .cache/models/Hy-MT2-1.8B-Q4_K_M.gguf` passed. It verified 1,133,080,448 bytes and SHA-256 `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
- Server: `llama-server.exe --model .cache/models/Hy-MT2-1.8B-Q4_K_M.gguf --alias auralis-hy-mt2-1.8b-q4 --host 127.0.0.1 --port 18083 -c 2048 -ngl 99 --jinja`. `/health` returned `{"status":"ok"}`. The server was stopped after the translation.
- Source: the synthetic two-cue plain SRT fixture, SHA-256 `442d0fc3d1d94734c35f6d9b618bf2181e595b036672457e4d7cd7bdee561321`.
- Glossary input: `{"schema_version":1,"entries":[{"source":"你好","target":"Привет","segment_ids":[1]}]}`. The CLI froze this exact JSON in its managed glossary directory.
- Profile: [`hy_mt2_1_8b_q4_k_m.glossary.experimental.json`](../../models/manifests/hy_mt2_1_8b_q4_k_m.glossary.experimental.json), one target cue per block and one source-context cue on each side.

## Command and observation

```sh
task cli -- translate-glossary crates/auralis-translation-formats/tests/fixtures/plain.srt .cache/glossary-state models/manifests/hy_mt2_1_8b_q4_k_m.glossary.experimental.json .cache/glossary-smoke.json http://127.0.0.1:18083/ .cache/glossary-out.srt
task cli -- status .cache/glossary-state 3faec6e0-6ea8-4a89-9c61-b04092f5eed7
task cli -- diagnostics .cache/glossary-state 3faec6e0-6ea8-4a89-9c61-b04092f5eed7
```

The translation command exited 0 in about 22 seconds. It reported `translation_id=7ab398f7-7846-4937-b8d6-0fca2752c031`, `run_id=3faec6e0-6ea8-4a89-9c61-b04092f5eed7`, and `result_id=a08c203a-2a8d-4251-b5a2-6cee23a7098f`. Status reported `validated`, two of two blocks saved, and `needs_review`. The source and managed source hashes matched. The separate output SHA-256 was `7e00b71db482a49f2897a9edb97da8d91eb592735c79d74c12a4d676d94958f6`.

The output preserved cue labels, order, timing, line count, and separators. The first target line was `Здравствуйте.`, although the confirmed term requested `Привет`. `diagnostics` reported one `glossary_term_missing` warning for segment 1, line 0. The second cue's two different source lines both became `Завтра увидимся. До свидания.`; this is another concrete quality concern. No bilingual reviewer has scored the sample. A single synthetic file cannot establish expected adherence frequency or overall translation quality.

After stopping the server, `resume` re-exported the validated result to a new path without contacting it. The re-export SHA-256 matched the first output exactly. This demonstrates reconstruction of the same structurally checked result, not a real-model interrupted run.

Prompt version 3 remains experimental. Before selection, it needs a licensed multi-scene corpus, term-level review, comparisons with other profiles, and analysis of repeated phrasing. The advisory warning caught this instance but cannot prove absence of other terminology or meaning errors.
