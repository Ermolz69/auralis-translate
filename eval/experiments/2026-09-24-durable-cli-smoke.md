# Durable CLI smoke with the local Hy-MT2 model

Date: 24 September 2026. This is an SRT/SQLite/CLI integration smoke, not a bilingual quality evaluation or a crash test of the real model. The [first model smoke](2026-09-24-hy-mt2-first-smoke.md) records the download provenance, verified model/runtime SHA-256 values, hardware, and initial inference timings.

## Setup

- Windows 10 host with NVIDIA RTX 3070, as recorded in the first smoke.
- Previously verified `tencent/Hy-MT2-1.8B-GGUF` Q4_K_M model file, revision `a0c709d9fac510f2c807aa3af52872340dc37a4a`, SHA-256 `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
- Previously verified llama.cpp server b10977, listening on `127.0.0.1:18080`, with `-c 2048 -ngl 99 --jinja` and alias `auralis-hy-mt2-1.8b-q4`. The server was stopped before the re-export check.
- Profile: `models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json`.
- Input: repository's synthetic CC0 `crates/auralis-translation-formats/tests/fixtures/plain.srt` with two cues and three Chinese text lines.

## Commands and observed identities

```sh
task cli -- translate crates/auralis-translation-formats/tests/fixtures/plain.srt .cache/real-durable-state models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json http://127.0.0.1:18080/ .cache/real-durable-out.srt
task cli -- resume .cache/real-durable-state 3518139c-eb1a-47f7-a971-58d3d6b8ee7f models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json http://127.0.0.1:18080/ .cache/real-durable-out-copy.srt
```

The first command exited 0 and reported `translation_id=04f033cc-e356-4e25-8fe2-cac43c0d91db`, `run_id=3518139c-eb1a-47f7-a971-58d3d6b8ee7f`, and `result_id=a2dc57b4-3df8-423b-a5d6-f33d7ea9298b`, labelled `needs_review`. The second command exited 0 with the same IDs and label while the server was stopped; it regenerated the stored result without another model call.

| Artifact | SHA-256 |
| --- | --- |
| External original SRT | `442d0fc3d1d94734c35f6d9b618bf2181e595b036672457e4d7cd7bdee561321` |
| Managed source copy | `442d0fc3d1d94734c35f6d9b618bf2181e595b036672457e4d7cd7bdee561321` |
| First Russian SRT | `69e12c8a904dc5456ecb8e50065c6476f60bb5656a8d318103027ed7e3a03c0` |
| Re-exported Russian SRT | `69e12c8a904dc5456ecb8e50065c6476f60bb5656a8d318103027ed7e3a03c0` |

The output preserved both cue labels, timing lines, cue order, line counts, and source line endings. The observed Russian text was `Здравствуйте.`, `Увидимся завтра.`, and `До свидания.` in the corresponding slots. The original remained unchanged.

The later `task cli -- doctor models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json .cache/models/Hy-MT2-1.8B-Q4_K_M.gguf` check also exited 0, reporting SHA-256 `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`, 1,133,080,448 bytes, and `verified=true`. It hashes the local file; it does not attest which weight a separate server has loaded.

## Limits of this evidence

The separate mock-server CLI test injects a failure after one committed block and proves skip-on-resume; this real-model smoke completed without interruption. No bilingual reviewer has scored the text. The CLI currently trusts the configured server alias and profile; it does not attest the loaded model weight at request time. The runtime installer, platform packaging, automated server lifecycle, context-aware planning, quality diagnostics, and Auralis project publication remain open.
