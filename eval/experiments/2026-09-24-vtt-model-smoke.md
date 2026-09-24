# First real-model strict-WebVTT smoke

Date: 24 September 2026. This is technical feasibility evidence for the experimental, non-durable WebVTT path. It does not establish language quality, durable resume, general WebVTT support, or release readiness.

## Setup

- Windows 10, RTX 3070, locally cached official Tencent Hy-MT2-1.8B-GGUF Q4_K_M, llama.cpp b10977 CUDA runtime. The model file was previously verified at 1,133,080,448 bytes with SHA-256 `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`; see the [glossary smoke](2026-09-24-glossary-profile-smoke.md).
- Local server: `llama-server.exe --model .cache/models/Hy-MT2-1.8B-Q4_K_M.gguf --alias auralis-hy-mt2-1.8b-q4 --host 127.0.0.1 --port 18084 -c 2048 -ngl 99 --jinja`. `/health` returned `{"status":"ok"}`. The server was stopped after the experiment.
- Profile: [`hy_mt2_1_8b_q4_k_m.experimental.json`](../../models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json), prompt version 1.
- Source: synthetic plain WebVTT with one Chinese cue, a cue ID, and a protected `NOTE` block. Source SHA-256: `c72dc150a1d0c08a82f6883e3ecc85dff3d224d25f828a2d6bc3af82caa689f4`.

## Command and observation

```sh
task cli -- translate-vtt-experimental .cache/vtt-20260924-smoke/source.vtt models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json http://127.0.0.1:18084/ .cache/vtt-20260924-smoke/translated.vtt
task cli -- inspect-vtt .cache/vtt-20260924-smoke/translated.vtt
```

The command exited 0. The result contained `Здравствуйте.` for `你好。`; its SHA-256 was `6e8af9c4e7f55e7746f22179aa347713c7cb0e04fef87e01cd12a57123884179`. The `WEBVTT` signature, `NOTE` block, cue ID `scene-1`, timing `00:01.000 --> 00:02.500`, line structure, and trailing newline were unchanged. `inspect-vtt` reported one cue, ID 1, start 1000 ms, end 2500 ms. The original source hash was unchanged.

The server log reported about 505 ms for the one generation after model load: 26 prompt tokens and 9 output tokens. This single warm generation is not an end-to-end performance benchmark. The experimental command has no Translate SQLite run, checkpoints, pause/resume, checked server preflight, glossary, or Auralis publication. No bilingual reviewer scored the translation.
