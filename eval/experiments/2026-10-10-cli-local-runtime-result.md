# CLI-owned local runtime result, 10 October 2026

Identity: `CLI-01/INT-TR01-local-runtime-v1`, following the
[frozen plan](2026-10-10-cli-local-runtime-plan.md). Status: **passed for the
development-host one-command integration slice**. This is not a Chinese
language-quality, clean-install, or packaged release claim.

## Execution

- The local implementation and plan were committed before real inference as
  Translate `f76025d`. The subsequent offline validated-run shortcut and typed
  machine errors were checked after the real model runs and are recorded in
  this acceptance slice.
- Windows x64 development host, Rust 1.95.0, checked Hy-MT2 1.8B Q4_K_M
  profile, model SHA-256
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
  llama.cpp b10977 executable SHA-256
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
  No `llama-server`, `auralis-translation-cli`, or Auralis app process
  was observed before admission. The RTX 3070 reported 992/8192 MiB used
  beforehand; peak resources were not sampled.
- One `task cli -- translate-local SOURCE STATE PROFILE SERVER_EXE MODEL_FILE
  99 OUTPUT` invocation translated the authored two-cue SRT and exited zero.
  The debug transcript is retained at ignored
  `.cache/eval/cli-local-runtime-v1/srt.log` (1,353 bytes, SHA-256
  `7007d6d2a320694b21c34f96fb24e168daddf1ba990e08963fd4c05c1595773c`).
- After `task build:release`, one `task cli:release --
  translate-vtt-local SOURCE STATE PROFILE SERVER_EXE MODEL_FILE 99 OUTPUT`
  invocation translated the authored two-cue strict WebVTT and exited zero.
  Its transcript is `vtt.log` (837 bytes, SHA-256
  `67fec7fbab15b2efa2475812bb754d51d8eb661ae008ca3db4df04a77125e406`).
  Both server reports matched the checked alias, build and 2048-token context.

## Observed outputs and recovery

| Format | Frozen source SHA-256 | Complete separate output SHA-256 | Run/result |
| --- | --- | --- | --- |
| SRT | `17d8ba2b869d4f4a6ae29fbc7d16f0cf0230ba0ff8e1884c19817b68e7921921` | `62bd4af8e28803f02c82e2a7b7b9be3a2056a095f476c5d4e54f4024e0825695` | `dcf2af71-1871-4814-80c3-8db67ffceb4a` / `87a9c309-00fa-4706-8d88-2f5e54f1401e` |
| WebVTT | `050f00531fbe714aa2f183e75cdb604a91fad9ac07b251e01d5e721af19bd175` | `1150dc0d42a51ca82dedc474e5871ad720a708e52766e98ad6ca598d40e12d69` | `58cae201-e99a-4e9e-b036-7147651f7f0a` / `8fcc2d85-a9c8-445a-bba0-21208ffc3d0e` |

Both results contain `Здравствуйте.` and `До свидания.`; those strings
are trace values, not a quality score. `task cli -- inspect` and
`task cli:release -- inspect-vtt` accepted the outputs with two cues,
unchanged identities and timing. The source hashes after both runs matched the
predeclared hashes. The status of each durable run was `validated`, with one
of one saved blocks and `needs_review` (no approval inferred).

An attempted second SRT invocation against the occupied output refused
overwrite before model startup; `occupied.log` retained the expected
nonzero outcome. A later `resume-local` call for each validated run used
nonexistent executable and model paths, exported to a new file without a server,
and returned the exact same output SHA-256. No new inference was needed. After
each completed command, no `llama-server` or CLI process remained. No staging
`.tmp` or `.part` file remained in the owned probe directory.

## Checks and limits

The repeatable local-only `task eval:cli:local:e2e` check was added after the
initial manual acceptance. On the same checked 1.8B model and runtime it passed
both SRT and strict WebVTT full CLI round trips. Source SHA-256 values were
`e28a722eb38da1a1f3ebb2c941e78697e835ad7cd7d2d2949794f2028dc2746b`
and `5c89f87be30c903460f70d73d458c84e0cfa02eb83120e23adbc367c2c961bbc`;
separate outputs were
`8dffe24484126ef828a48c66b4f8692dca3a7103aeff069c4679693ba4499826`
and `308b16c249b8621638330441e72575b9d806aa9326575c2ac453d12fd09dc07f`.
Each result was exported again from the durable run with deliberately absent
runtime/model paths and byte-identical output. Occupied-output refusal and
unchanged source bytes passed for both formats. The successful temporary run
directory was removed. An initial sandboxed harness attempt failed with
`spawnSync EPERM` before inference; its single temporary source file was
removed after the authorized local rerun passed. This check is deliberately
absent from CI and does not assess translation quality.

- `task build`, `task build:release`, `task fmt`, `task lint`,
  `task test:cli:local` (3/3), `task test:cli:protocol` (7/7),
  `task docs:check`, `task plan:check`, `task site:build` and
  `task site:check` passed. Checks after the final result record are linked
  from the backlog status.
- This authored two-cue proof does not test natural long-file quality,
  approved translation, installed-app packaging, a clean Windows machine,
  or concurrent Auralis/TTS model admission. The selected release gates
  G3–G5 and G9 remain open.
