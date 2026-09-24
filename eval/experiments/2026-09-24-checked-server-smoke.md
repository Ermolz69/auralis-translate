# Checked-server real-model smoke

Date: 24 September 2026. This verifies the opt-in server preflight and a complete strict-SRT CLI translation on the pinned local model. It is not a cryptographic attestation of in-memory weights or a language-quality gate.

## Contract and setup

The pinned [llama.cpp b10977 server documentation](https://github.com/ggml-org/llama.cpp/blob/b10977/tools/server/README.md) documents `/health`, `/props`, and `/v1/models`. The live b10977 server at `127.0.0.1:18081` reported `status=ok`, `model_alias=auralis-hy-mt2-1.8b-q4`, `build_info=b10977-0ecb159c9`, `default_generation_settings.n_ctx=2048`, and the absolute path of the local GGUF. `/v1/models` returned the same alias. The server was stopped after the smoke.

The [checked experimental profile](../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json) pins the expected runtime build, model byte count, SHA-256, and minimum context size in addition to the earlier prompt-v1 settings. Before opening a run attempt, the CLI checked the three endpoints, canonicalized the server-reported absolute path, compared the local file size, and streamed the file through SHA-256. The resulting `model_ready` event preceded the first saved-block event. A mock-server integration test separately proved that a mismatched local file hash prevents inference and leaves the run `requested` with no checkpoint.

## Command and observed result

```sh
task cli -- translate crates/auralis-translation-formats/tests/fixtures/plain.srt .cache/checked-state models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json http://127.0.0.1:18081/ .cache/checked-out.srt
task cli -- status .cache/checked-state de6451e6-069b-4d67-9e7e-e12191b05035
```

The first command exited 0 and reported `translation_id=9c848a4e-7c91-4a33-9d07-ee8c4f456bad`, `run_id=de6451e6-069b-4d67-9e7e-e12191b05035`, `result_id=459af7b6-1050-4f35-9064-50ba47c95792`, and `review=needs_review`. It reported `model_ready alias=auralis-hy-mt2-1.8b-q4 build=b10977-0ecb159c9 context_tokens=2048`, then 0/1 and 1/1 saved blocks. The status command reported `validated`, `pause_requested=false`, and the selected result. The source and managed-copy SHA-256 were both `442d0fc3d1d94734c35f6d9b618bf2181e595b036672457e4d7cd7bdee561321`; the separate output SHA-256 was `69e12c8a904dc5456ecb8e50065c6476f60bb5656a8d318103027ed7e3a03c0`.

The output preserved cue labels, timing lines, cue order, line counts, and separators. It contained `Здравствуйте.`, `Увидимся завтра.`, and `До свидания.` in the corresponding slots, matching the earlier prompt-v1 smoke on this fixture. No bilingual reviewer has scored it. File hashing added roughly a minute to this debug-build invocation; this is an observation from the command duration, not a benchmark.

The preflight trusts the response of a loopback server and checks the file currently at its reported path. It cannot prove that those exact bytes remain loaded in server memory, nor that an independently started process is the expected child. Host-owned process lifecycle, immutable installed model files, runtime binary verification, authentication, platform packaging, and resource gates remain open.
