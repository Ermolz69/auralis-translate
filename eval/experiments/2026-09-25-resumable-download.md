# Pinned asset acquisition and online CPU package

Date: 25 September 2026. Scope: one experimental Windows x64 CPU package on the development machine. This is download and package-path evidence, not a clean-machine or language gate.

## Inputs

The [release manifest](../../models/releases/hy_mt2_1_8b_q4_k_m.windows_x64_cpu.experimental.json) binds the [checked profile](../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json) to the Hy-MT2 GGUF (1,133,080,448 bytes), llama.cpp b10977 CPU ZIP (18,428,830 bytes), and two license notices. The pinned lengths, SHA-256 values, revisions and upstream references are recorded in the [offline installation evidence](2026-09-25-offline-cpu-install.md). Downloads, cache entries, partial files, and installed outputs stayed in ignored `.cache/` directories.

## Observed checks

- `task check` passed after implementation: formatting, Clippy with warnings denied, and the workspace tests. The downloader tests cover complete transfer, verified cache reuse, HTTP Range resume of a local partial, a server that ignores Range, rejection of a wrong Content-Range, and rejection of an insecure redirect without publishing a final cache file. The manifest test rejects case-insensitive duplicate cache filenames.
- `task cli -- fetch-release RELEASE_MANIFEST CHECKED_PROFILE cpu CACHE_DIR` passed against an existing local complete asset set. It rehashed the model, ZIP, and both notices before reporting four cached paths.
- With network access, `task cli -- fetch-asset RELEASE_MANIFEST CHECKED_PROFILE cpu MODEL-LICENSE.txt CACHE_DIR` downloaded and verified the upstream model notice. The same command downloaded and verified the llama.cpp release ZIP through GitHub's asset redirect.
- The first model-weight fetch stopped at a redirect that the initial exact-host list did not admit. The redirect policy was changed to accept HTTPS destinations on the Hugging Face-owned `huggingface.co` and `hf.co` domain trees, with no credentials or explicit port, while retaining the pinned length and digest as the content boundary. [Hugging Face's model download documentation](https://huggingface.co/docs/hub/models-downloading) lists several CDN hostnames and advises allowing those domain suffixes because hosts vary. Repeating `task cli -- fetch-asset RELEASE_MANIFEST CHECKED_PROFILE cpu Hy-MT2-1.8B-Q4_K_M.gguf CACHE_DIR` downloaded the full 1,133,080,448-byte model and published its cache name only after verification.
- `task cli -- install-online RELEASE_MANIFEST CHECKED_PROFILE cpu CACHE_DIR INSTALL_ROOT` passed using the verified cache, fetched the missing runtime notice, and created a separate versioned CPU package with `runtime/llama-server.exe`, `model/Hy-MT2-1.8B-Q4_K_M.gguf`, `profile.json`, `release.json`, `notices/`, and the retained upstream archive. The command did not modify an existing package.
- `task cli -- doctor INSTALLED_PROFILE INSTALLED_MODEL` returned `verified: true`, 1,133,080,448 bytes, and SHA-256 `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699` for the model inside the newly installed package.

All paths in these commands were absolute paths inside the repository's ignored `.cache/` tree. The source manifest and checked profile were the versioned files linked above.

## Limits and next checks

Local HTTP tests prove the Range and restart rules, but a deliberately interrupted **real** CDN transfer has not yet been resumed. This run reused a complete cache for installation; it was not a clean offline Windows machine. The installed runtime has not been started through this new package path, selected from Auralis, or assessed for translation quality. Auralis still needs application-data installation, selection, upgrade and removal behavior, and the clean offline smoke required by S6/S8.
