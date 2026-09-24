# First context-profile smoke

Date: 24 September 2026. This is feasibility evidence for the version-2 context prompt and one-target-segment block planner. It is **not** a language-quality gate.

## Setup and command

- Same locally verified Tencent Hy-MT2-1.8B-GGUF Q4_K_M model, llama.cpp b10977 runtime, Windows 10 host, and RTX 3070 as the [first model smoke](2026-09-24-hy-mt2-first-smoke.md).
- Server: `llama-server.exe --model .cache/models/Hy-MT2-1.8B-Q4_K_M.gguf --alias auralis-hy-mt2-1.8b-q4 --host 127.0.0.1 --port 18081 -c 2048 -ngl 99 --jinja`. `/health` returned `{"status":"ok"}` before inference. The server was stopped afterward.
- Profile: [`hy_mt2_1_8b_q4_k_m.context.experimental.json`](../../models/manifests/hy_mt2_1_8b_q4_k_m.context.experimental.json), with prompt version 2, one target cue per block, one neighboring cue on either side, and 4096 bytes of context text maximum.
- Input: the repository's synthetic two-cue plain SRT fixture, source SHA-256 `442d0fc3d1d94734c35f6d9b618bf2181e595b036672457e4d7cd7bdee561321`.

```sh
task cli -- translate crates/auralis-translation-formats/tests/fixtures/plain.srt .cache/context-state models/manifests/hy_mt2_1_8b_q4_k_m.context.experimental.json http://127.0.0.1:18081/ .cache/context-out.srt
task cli -- status .cache/context-state daefd6f2-ccaa-465b-a3d9-85ef72d0d032
```

The translation command exited 0 with `translation_id=2d0e61e4-cc7f-48e5-a066-7c04446149c2`, `run_id=daefd6f2-ccaa-465b-a3d9-85ef72d0d032`, and `result_id=41f91241-80cf-405c-adaf-e7b547f4ae95`. Progress reached 2/2 committed blocks. `status` reported `validated`, `pause_requested=false`, and `needs_review`. The managed source SHA-256 still matched the external original. The separate output SHA-256 was `cf4052a778179c53c79de25d4eb59ec5ac121b74447c54592cbe4a22d65ab8ba`.

The output preserved both cue labels, timing lines, cue order, line counts, and separators. Its Russian text was `Здравствуйте.`, then `До встречи.` and `До встречи.` for the two lines of the second cue. The older prompt-v1 smoke on the same fixture produced distinct translations for those lines: `Увидимся завтра.` and `До свидания.`. This observed repetition is a concrete quality concern; it does not prove which profile is better on a representative corpus. The context profile remains experimental and is not the default. No bilingual reviewer has scored either output, and this run did not measure RAM/VRAM or a repeated-run distribution.
