# Managed runtime memory policy

Date: 26 September 2026. Decision: explicitly bound llama.cpp's transient RAM prompt cache and run one generation slot in the managed Auralis runtime.

## Evidence and reason

The first 1024-cue SRT recovery run completed, but sampled model-process working set reached 5,693,984,768 bytes and private memory reached 6,103,552,000 bytes. The resumed process grew across many independent line requests. This observation does not alone prove a leak or its cause.

The [pinned b10977 server documentation](https://github.com/ggml-org/llama.cpp/blob/b10977/tools/server/README.md) declares an 8192 MiB RAM cache default and allows disabling that cache with zero. Leaving this implicit is unsuitable for our intended desktop resource policy. The controlled second invocation is recorded in [the long-file investigation](../../eval/experiments/2026-09-26-long-file-recovery.md).

## Contract

- `ManagedRuntimeConfig.ram_cache_mib` is a validated operational setting, from 0 to 512 MiB. The managed default is 0: the cross-request RAM prompt cache is disabled.
- Auralis passes `--cache-ram` explicitly and sets `--parallel 1`. The shared resource lease remains responsible for admitting one active managed translation attempt.
- A missing `ram_cache_mib` field in the optional development `translation-runtime.json` uses the managed default. Existing configuration files remain readable. Negative, oversized and malformed settings are rejected through normal typed configuration errors.
- The pinned package selects the managed default. No UI exposes this runtime detail; it is a backend resource setting.
- This cache is transient model-server state. Accepted translation checkpoints remain in Translate SQLite, and saved results retain their original model/prompt/source fingerprints. Disabling the server cache does not delete or replace checkpoints or completed outputs.
- The cap does not bound total process RAM, KV memory or VRAM. Model loading, runtime allocations and other work still need measurement. It is not a minimum-hardware or OOM guarantee.

The local long-file harness can set `AURALIS_TEST_RAM_CACHE_MIB=0` to reproduce the managed setting, or omit the variable to measure the upstream default. The report must record which case actually ran. Both use the same checked weights/profile and distinct state directories; generation is sampled, so candidate text and wall time may vary.

## Validation and remaining work

Both SRT and WebVTT 1024-cue recovery runs passed with explicit zero, retaining their exact saved checkpoints and byte-identical offline re-export. Sampled model working set reached 1,539,821,568 bytes for SRT and 1,539,801,088 bytes for WebVTT, compared with about 5.7 GB in the retained baseline. Observed private memory was about 1.96 GB rather than 6.1 GB. These are sampled maxima on one machine, not exhaustive peaks or isolated throughput measurements.

In Auralis, `task rs:clippy` and `task rs:test:translate` passed after adding a direct test-only HTTP client dependency. The configuration behavior test accepts 0, 128 and 512 MiB and rejects 513 and `u32::MAX` before model admission. With the supplied checked assets, `task rs:test:translate -- --test managed_runtime_real -- --ignored --nocapture` passed in 158.03 seconds: the actual managed server reports one slot and becomes unreachable after lease release. Most of that path includes checked model identity work; it is not startup SLA evidence.

`task desktop:e2e:native:translation` also passed through React, IPC, Rust, the real checked model and both SQLite files to a separate output. Its isolated development configuration omits `ram_cache_mib`, so this run exercises backward-compatible defaulting through the actual desktop bootstrap. The first sandboxed invocation could not spawn bundled ffmpeg (`EPERM`); the same task passed with permission to execute the local test tools. The harness removed its temporary application data and test frontend after verification.

Clean-machine, CPU/GPU coexistence and resource-budget gates remain open.
