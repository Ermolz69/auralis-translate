# Long-file recovery probe

Status: test protocol, 26 September 2026. This extends S4/S6/S8 technical evidence. It does not replace real scene evaluation, bilingual review, target-player export or clean-machine validation.

## Inputs and runtime

The [fixture manifest](../../eval/fixtures/long-file-v1.json) generates 1024 Chinese cues and 1280 logical text slots on a synthetic 102-minute timeline. It uses project-authored short statements, unreviewed Russian drafts and a distinct `AUR-0001` style marker in each cue. Every fourth cue has two lines. Both formats have BOM/CRLF. SRT includes repeated external labels; WebVTT includes absent labels and a protected `NOTE` header.

This is a repeated synthetic load fixture. Its timing does not come from speech; its Russian drafts are not an approved reference corpus. Coverage of arbitrary dialogue, scene context, readability, dialects or language-release quality cannot be inferred from it. Marker preservation and draft equality are separate textual diagnostics.

The opt-in Windows task uses the optimized standalone CLI and a separately supplied checked local model/runtime:

```powershell
$env:AURALIS_TEST_LLAMA_SERVER = 'C:\absolute\runtime\llama-server.exe'
$env:AURALIS_TEST_GGUF = 'C:\absolute\models\Hy-MT2-1.8B-Q4_K_M.gguf'
$env:AURALIS_TEST_GPU_LAYERS = '0'
$env:AURALIS_TEST_RAM_CACHE_MIB = '0'
task eval:cli:long:interruption
```

Compatible GPU DLLs must already be available on `PATH` for a GPU run. No weights, runtime or corpus are downloaded by this task. `task build:release` compiles the CLI offline, and `task eval:load:checks` verifies fixture, checkpoint and process-capture invariants before inference. Node.js with `node:sqlite` is required by the test harness; it is outside the product crate graph.

The explicit RAM-cache setting reproduces the [managed runtime policy](../architecture/008-managed-runtime-memory.md). Omitting the variable uses the upstream cache setting; the first run exposed substantial memory growth and is retained as baseline evidence. Cache/slot controls do not bound all model/runtime allocations.

## Recovery sequence

1. Generate separate source and draft-reference files inside ignored `.cache/eval/long-file-runs/`. Inspect and extract all slots before launching the model.
2. Start a loopback model server using the existing checked profile. Invoke the normal durable CLI against a fresh state directory.
3. Observe at least 16 committed blocks, then forcibly terminate the CLI. Record the actual saved count after termination, rather than assuming the timing always kills at precisely 16.
4. Read a consistent SQLite snapshot. Require an incomplete running attempt, a contiguous saved prefix, zero results, no partial output file and byte-identical external/managed originals.
5. Stop the test-owned model server and start a fresh one. A resume with changed profile bytes must fail without changing durable state or creating output.
6. Resume the same `run_id` with its original profile. Require a validated result, closed interrupted/resume attempts, the complete planned block count and identical saved checkpoint payloads, input fingerprints, diagnostics, retry counts and commit timestamps.
7. Reinspect the separate output, compare every cue/text-slot identity and protected byte range, and check source/result digests. An existing output must remain unchanged after a rejected export.
8. Stop the model and re-export the stored result without inference. Require byte-identical output. Save source/draft/candidate comparisons and the interrupted/completed snapshots.

SRT and WebVTT run sequentially with separate durable state. The harness owns its manually launched model processes; this is not evidence that the standalone CLI manages or terminates an externally supplied server. Auralis managed-process recovery has separate native tests.

## Observability and limits

Every process capture declares its bound and records truncation. A truncated inspection causes the probe to fail, because incomplete output cannot prove full-file preservation. UTF-8 decoding retains split byte sequences, and process completion waits for pipe closure. CLI/model logs and failure state remain local; successful state is also retained for later verification.

The harness samples tracked process working set/private memory/CPU and device-wide GPU memory every five seconds. Sampling failures remain explicit in the resource record. These are approximate observations, not exhaustive peaks; GPU memory includes other applications. Wall times include checked preflight and persistence. No hardware minimum, throughput SLA or coexistence with ASR/TTS is established by this run.

The per-phase timeout is bounded. One forced CLI termination at a named saved-block boundary does not establish power-loss durability or all cancellation/failure interleavings. The model uses the current experimental sampling profile, so unsaved candidate text may differ after restart. Committed checkpoints and offline re-export must remain identical regardless.

Generated inputs, draft references, full comparisons, SQLite state, resource samples and runtime files are never production dependencies or release assets. The application still obtains weights only through explicit installation/selection; see [delivery evidence](../../eval/experiments/2026-09-26-translation-delivery-audit.md).
