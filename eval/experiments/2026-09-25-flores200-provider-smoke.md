# FLORES-200 checked-provider sentence smoke

Date: 25 September 2026. Scope: **one `dev` sentence each** for Simplified Chinese → Russian and Japanese → Russian. This checks the auxiliary comparison tool and local provider path. It is neither a model-selection result nor subtitle language-gate evidence.

## Inputs and method

- Corpus: [pinned official FLORES-200 archive](../corpora/flores200-archive-b8b0b767.json), SHA-256 `b8b0b76783024b85797e5cc75064eb83fc5288b41e9654dabc7be6ae944011f6`; `dev` row 1 in `zho_Hans` and `jpn_Jpan`, aligned to `rus_Cyrl` row 1.
- Profile: [checked prompt-v1 Hy-MT2 Q4_K_M profile](../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json), SHA-256 `dba1d341230bc4f1117c6fba8ce55a1127b120864aa8363295bdbc883b98fc3e`.
- Loaded model: local GGUF SHA-256 `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`; verified server build `b10977-0ecb159c9` with 2048 context tokens. The host reported an RTX 3070 with 8192 MiB VRAM. This is the same locally installed model/runtime as the earlier [SRT feasibility smoke](2026-09-24-hy-mt2-first-smoke.md).
- The tool checked the full corpus manifest, then the server-reported alias, runtime build, model path, file size and SHA-256 before inference. It reused the production prompt-v1 provider and response validator. Its internal placeholder time span satisfies the provider batch contract; the report contains no subtitle timings and explicitly marks `subtitle_holdout=false` and `bilingual_reviewed=false`.

Commands, after starting the checked local server at `127.0.0.1:18090`:

```text
task eval:flores:compare -- dev zho_Hans 1 models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json http://127.0.0.1:18090/ .cache/eval/runs/hy-mt2-dev-zho-hans-1-v2.json
task eval:flores:compare -- dev jpn_Jpan 1 models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json http://127.0.0.1:18090/ .cache/eval/runs/hy-mt2-dev-jpn-jpan-1-v2.json
```

Both commands exited 0 and created new JSON reports only under the ignored `.cache/eval/runs/` directory. The reports include the publisher URL and CC BY-SA 4.0 attribution metadata. Report hashes are `615ad835887c42bfa4eeb5f61a32f32df8d0eb25420605927d79598469f679d4` (Chinese) and `91e75d3e228ab9f7c5eed045d9d99dd6a0887b558a4c53b195820f1aa0773e35` (Japanese). The warm provider calls took 1020 ms and 919 ms respectively; those are not file-level throughput measurements. The server was stopped afterward. This experimental profile uses nonzero temperature without a pinned random seed, so the exact candidate text and report hash can vary on repeat runs.

## Observed limitation

The Japanese source row expresses the chip cost in **yen**, while its aligned Russian reference expresses the price in **US cents**. The candidate follows the Japanese currency. A metric based only on the single Russian reference could therefore penalize a source-faithful answer or obscure a source/reference mismatch. A bilingual reviewer must adjudicate the source, output, and reference before any adequacy claim. These are article sentences without scenes, cue boundaries, or timing; even a reviewed sentence score cannot close S8/S9. No score was calculated.

Next evaluation work: select diverse `dev` row IDs by domain/topic, run competing pinned profiles on the same IDs, inspect source/reference divergences, then acquire and review real licensed timed-text scenes for the release holdout.
