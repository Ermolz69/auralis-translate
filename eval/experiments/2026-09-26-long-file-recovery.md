# Long-file recovery and managed memory investigation

Date: 26 September 2026. Scope: S4/S6/S8 technical evidence with an optimized CLI, supplied checked assets and synthetic Chinese text. This is not a language-quality or clean-machine gate.

## Reproduction and inputs

From the standalone Translate checkout:

```powershell
$env:AURALIS_TEST_LLAMA_SERVER = 'E:\Anything\Projects\Commercial\auralis-translate\.cache\runtime\llama\llama-server.exe'
$env:AURALIS_TEST_GGUF = 'E:\Anything\Projects\Commercial\auralis-translate\.cache\models\Hy-MT2-1.8B-Q4_K_M.gguf'
$env:AURALIS_TEST_GPU_LAYERS = '99'
$env:PATH = 'E:\Anything\Projects\Commercial\auralis-translate\.cache\runtime\cudart;' + $env:PATH
$env:AURALIS_TEST_RAM_CACHE_MIB = '0'
task eval:cli:long:interruption
```

The baseline used the same command with `AURALIS_TEST_RAM_CACHE_MIB` absent and no `--cache-ram` argument. `LLAMA_ARG_CACHE_RAM` was also unset. Each task ran SRT then WebVTT in independent state directories. No model, runtime or corpus was downloaded or published.

The [protocol](../../docs/evaluation/005-long-file-recovery.md) and [fixture manifest](../fixtures/long-file-v1.json) define 1024 cues, 1280 logical text slots and a 6,143,000 ms synthetic timeline per format. Eight authored short Chinese templates repeat with unique per-cue markers; every fourth cue has two lines. Both files use BOM/CRLF. SRT repeats external labels; WebVTT omits some labels and preserves a `NOTE` header. Russian draft references are authored but unreviewed. A long artificial timeline and repeated short text do not supply representative subtitle coverage.

- Fixture manifest SHA-256: `0527cab3c4ea38aa91ae65c6f4e52103d7e0c5cde1ab778dc7e9da1a46c43986`.
- SRT source SHA-256: `e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3`.
- WebVTT source SHA-256: `7798473721a55dae7f77756531f02f44de6f334e44c767553abe43ee50bc5f1f`.
- Checked profile SHA-256: `dba1d341230bc4f1117c6fba8ce55a1127b120864aa8363295bdbc883b98fc3e`.
- Hy-MT2-1.8B Q4_K_M model SHA-256: `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
- Checked runtime build: `b10977-0ecb159c9`. Requested GPU offload layers: 99; one generation slot.
- Optimized CLI SHA-256: `00e7c75d9e5abb5f0501c0488b3c41a632f6bbb4a6291367a7ea7dc40c0d9525`.
- Observed machine: Windows kernel 10.0.19045, Intel Core i7-6900K, 51,458,560,000 bytes physical memory, NVIDIA GeForce RTX 3070 with 8192 MiB. These are observations, not a minimum platform profile.

## Recovery outcomes

Both invocations of `task eval:cli:long:interruption` exited 0. All four format runs:

- Inspected all slots before inference and forcibly stopped the CLI after exactly 16 of 128 durable blocks in the observed run.
- Retained an incomplete run with no output file and no partial result. External and managed originals remained byte-identical.
- Rejected a changed profile without changing durable state or publishing output.
- Restarted the test-owned model, resumed the same run and preserved every saved checkpoint's payload, input fingerprint, diagnostics, attempt count and commit timestamp.
- Finished 128/128 blocks with two closed attempts (`interrupted`, then `validated`) and one `needs_review` result.
- Preserved cue/text-slot identity, order, timing, line count and protected bytes. All 1024 marker diagnostics passed.
- Refused an existing output and re-exported byte-identical output after the model stopped.

Each result had zero heuristic warnings and 384 exact draft-reference matches. Neither heuristic absence nor reference equality establishes adequacy. The sampling profile can produce different unsaved candidate text across invocations; no profile or quality winner was selected.

| Cache argument | Format | Run ID | Result ID | Resume time | Full probe time |
| --- | --- | --- | --- | --- | --- |
| Omitted | SRT | `e61e6fa6-0379-4f7d-9af9-769ea5381f2f` | `5b688493-862f-4ae6-b70a-e6c31964ba55` | 194,997 ms | 234,522 ms |
| Omitted | WebVTT | `daffd81d-1aae-4cef-ba82-c01899c70bd1` | `af217fb7-4f25-4d96-b0fe-a99d3f1809a2` | 216,771 ms | 254,897 ms |
| `--cache-ram 0` | SRT | `ccab713c-b156-4c60-8356-7a0d184ad080` | `cdb95e94-9b28-4a30-ad4f-c4f85f85a4b6` | 203,551 ms | 246,802 ms |
| `--cache-ram 0` | WebVTT | `27b48d34-a8e7-4a22-9878-c48237f9fe1c` | `60134221-dc5b-4e67-868c-92b7f4413616` | 192,717 ms | 235,044 ms |

Times include checked preflight, persistence and recovery work. Full probe time includes interruption, mismatched-profile rejection and re-export checks; it is not uninterrupted model throughput.

| Cache argument | Format | Separate output SHA-256 |
| --- | --- | --- |
| Omitted | SRT | `b30867bfa0cb20fd2a0f2b0ed8d090fa573649a858285e9e205dc5f3c152a955` |
| Omitted | WebVTT | `31f03eab71f734f36555e0933156476d1506992b8ff46ff2845c622ef7266736` |
| `--cache-ram 0` | SRT | `5405ee062ce09704a7fcde955e68373206ebc782f36cf2f0ae87da3b1cefd3de` |
| `--cache-ram 0` | WebVTT | `98465ac3493bb2c14daa25afb3f39cabec2b1235dd63fc4ff5773b7972329708` |

## Memory observation and contract

The five-second sampler recorded these largest observed model-process values, with no sampling errors in the retained reports:

| Cache argument | Format | Samples | Working set, bytes | Private memory, bytes |
| --- | --- | --- | --- | --- |
| Omitted | SRT | 47 | 5,693,984,768 | 6,103,552,000 |
| Omitted | WebVTT | 51 | 5,685,276,672 | 6,091,608,064 |
| `--cache-ram 0` | SRT | 49 | 1,539,821,568 | 1,958,723,584 |
| `--cache-ram 0` | WebVTT | 47 | 1,539,801,088 | 1,958,486,016 |

The baseline grew across repeated requests. The [pinned server documentation](https://github.com/ggml-org/llama.cpp/blob/b10977/tools/server/README.md) describes an 8192 MiB default RAM prompt cache and supports zero to disable it. The [managed runtime decision](../../docs/architecture/008-managed-runtime-memory.md) now requires an explicit validated cache setting, default zero, and one slot. The repeated fixture showed lower observed memory with that setting. This does not prove a leak, exhaustively measure peaks, bound total RAM/VRAM or establish ASR/TTS coexistence. Device-wide GPU samples include other applications.

## Checks and retained evidence

- `task build:release`: optimized offline CLI build passed.
- `task eval:load:checks`: five fixture/checkpoint/process-capture behavior tests passed.
- `task eval:file:checks`: seven existing file/profile comparison checks passed after the shared process helper changed.
- `task eval:cli:long:interruption`: baseline and explicit-zero invocations passed for both formats.
- In Auralis, `task rs:clippy` and `task rs:test:translate` passed. `task rs:test:translate -- --test managed_runtime_real -- --ignored --nocapture` passed one real managed-server test in 158.03 seconds, verifying one reported slot and process release with the new default cache setting.
- Auralis `task desktop:e2e:native:translation` passed the native React/IPC/model/two-database/separate-file path after the runtime change, using its old-style config without `ram_cache_mib`. The first invocation was stopped by sandbox `EPERM` when spawning bundled ffmpeg; the permitted repeat passed and cleaned its isolated sandbox. This is one-cue desktop compatibility evidence, separate from the long-file CLI runs.
- `task docs:check` passed in Translate (51 Markdown files) and Auralis (five checker tests and 31 Markdown files).

The process helper now decodes split UTF-8 writes, waits for pipe closure and reports capture truncation; incomplete inspection output fails verification. The baseline reports predate explicit cache-policy report fields; their actual omitted argument is documented here without rewriting retained evidence.

Local workspaces are `.cache/eval/long-file-runs/recovery-pHpTPW/` and `.cache/eval/long-file-runs/recovery-2QKUEe/`. They retain original/draft/candidate/re-export files, full comparisons, exact profiles, SQLite snapshots, CLI/model logs and resource samples. Only the small authored generator configuration and aggregate experiment record are tracked. The harness owns model shutdown; it does not prove that the standalone CLI manages an externally supplied server.

Remaining gates: representative cleared subtitle corpus and bilingual review, real glossary/context adherence, mid-request cancellation and command races, power-loss boundaries, clean-machine installation, target-player export and resource budgets on declared platforms. No S5/S8/S9 quality gate is closed by this record.
