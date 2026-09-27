# Experimental Hy-MT2-7B CLI profile

Status: real local Windows CUDA inference measured on 27 September 2026. This
adds a separately identified model to the existing CLI/provider boundary. It
does not change the Auralis desktop catalog or certify a language release.

## Identity and policy

The [7B fidelity profile](../../models/manifests/hy_mt2_7b_q4_k_m.fidelity.experimental.json)
pins Tencent revision `ab8472660ac61fac25f1af43fac2599d52a8a775`, a
4,624,648,896-byte Q4_K_M file and its SHA-256. Its policy is identical to the
existing 1.8B fidelity profile: prompt v4, 2048-token context, temperature 0.7,
top-p 0.6, top-k 20, repeat penalty 1.05 and 256 output tokens per line. Only
model identity fields change. Both use llama.cpp `b10977-0ecb159c9`.

The core/provider APIs required no model-specific rewrite. The same readiness,
local file hash, response validation, currency restoration, immutable source,
SQLite checkpoint and offline re-export paths execute with the new profile.
Changing profile or model requires a fresh run; resume keeps its frozen profile.

## Acquisition and use

```powershell
task model:7b:fetch
task model:7b:doctor
task model:7b:serve
```

The fetch task uses the existing verified downloader with the separate
[CPU package manifest](../../models/releases/hy_mt2_7b_q4_k_m.windows_x64_cpu.experimental.json).
It acquires model, licenses and CPU runtime into ignored `.cache/models`.
`task model:7b:install` installs that CPU package into `.cache/installed-models`;
neither operation selects it in Auralis. Package installation evidence must not
be mistaken for a CPU speed benchmark.

The serve task uses the already supplied CUDA runtime at
`.cache/runtime/llama/llama-server.exe`, with companion DLLs at
`.cache/runtime/cudart`. Override `AURALIS_TEST_LLAMA_SERVER` for another supplied
runtime location and `AURALIS_MODEL_PORT` for the loopback port (default 18080).
It verifies the model with `doctor`, requests GPU layers 99, enables Jinja,
disables cache RAM and serves one slot. CUDA runtime acquisition is a separate
prerequisite; this task does not install GPU drivers. Translation preflight
checks the expected runtime build, model alias, file identity and context.

In another terminal:

```powershell
task cli -- translate source.srt state-7b models/manifests/hy_mt2_7b_q4_k_m.fidelity.experimental.json http://127.0.0.1:18080/ translated.ru.srt
```

Stop the serving terminal with Ctrl+C. Keep the source and profile for resume.
Use a separate state/run for a different model. The public report includes the
complete comparison data, not the downloaded weights or private databases.

## Reproducible comparison

```powershell
task eval:models:compare
task site:build
task site:check
```

The comparison makes four sequential cases: 1.8B then 7B on the original twenty
lines, then 7B followed by 1.8B on twenty currency/physical controls. Each case
has three fresh durable states and one persistent server. Only the supplied
model file and profile identity change. Reports and failures stay in ignored
`.cache/eval/model-size`; publication uses frozen evidence, never implicitly
overwrites an earlier benchmark. See the [experiment record](../../eval/experiments/2026-09-27-model-size-comparison.md).
