# Pinned offline CPU package installation

Date: 25 September 2026. Scope: one experimental Windows x64 CPU package on the development machine. This is packaging evidence, not a clean offline machine or translation-quality gate.

## Inputs and provenance

- Model: `tencent/Hy-MT2-1.8B-GGUF` revision `a0c709d9fac510f2c807aa3af52872340dc37a4a`, `Hy-MT2-1.8B-Q4_K_M.gguf`, 1,133,080,448 bytes, SHA-256 `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699` ([upstream revision](https://huggingface.co/tencent/Hy-MT2-1.8B-GGUF/tree/a0c709d9fac510f2c807aa3af52872340dc37a4a)).
- Runtime: [llama.cpp b10977](https://github.com/ggml-org/llama.cpp/releases/tag/b10977), source commit `0ecb159c9e93056a4742afe4195d05a2912b1746`; Windows CPU ZIP, 18,428,830 bytes, SHA-256 `bdbb1ee5368b44112fa3fa9b3ac168a15d0d492e5c2f9fbe2074dd2f4628a4b9`. The upstream [GitHub attestation](https://github.com/ggml-org/llama.cpp/attestations/47583571) lists this archive digest.
- Notices: the pinned model license is 11,639 bytes with SHA-256 `a1d52d448f81c584a47c583e19dfab2d3851c7c84431b07baee093c1113ed114`; the source-commit runtime license is 1,078 bytes with SHA-256 `94f29bbed6a22c35b992c5c6ebf0e7c92f13b836b90f36f461c9cf2f0f1d010d`.
- The checked model profile SHA-256 is `dba1d341230bc4f1117c6fba8ce55a1127b120864aa8363295bdbc883b98fc3e`. The versioned release manifest records these bytes and upstream URLs. All downloaded inputs and installed output stayed under ignored `.cache/` paths outside Git.

## Observed run

The local source directory contained the pinned GGUF, release ZIP, and two notices. The install was invoked through `task cli -- install-offline models/releases/hy_mt2_1_8b_q4_k_m.windows_x64_cpu.experimental.json models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json cpu SOURCE_DIR INSTALL_ROOT`, with absolute source and destination paths under `.cache/`. The first real run exposed a 1 MiB stack allocation in the CLI copy path and exited with stack overflow before publishing a final package. The buffer was moved to heap allocation. The orphaned test staging directory was removed after verifying its absolute path inside the named test installation root.

The repeated installation completed with exit code 0. It created `hy-mt2-1-8b-q4-windows-x64-cpu-b10977/cpu` under the ignored test root, including `runtime/llama-server.exe`, `model/Hy-MT2-1.8B-Q4_K_M.gguf`, `profile.json`, `release.json`, and notices. `task cli -- doctor INSTALLED_PROFILE INSTALLED_MODEL` returned `verified: true`, the pinned model revision, 1,133,080,448 bytes, and the expected SHA-256. The library tests separately reject changed model bytes and a ZIP path escape without creating a final selectable package.

This run did not start the installed CPU server, translate a subtitle through that executable, configure Auralis, verify a clean OS, or exercise download/resume and hard-kill recovery. The package is an experimental install artifact only. See [the installation design](../../docs/architecture/007-model-installation.md) for the remaining boundaries.
