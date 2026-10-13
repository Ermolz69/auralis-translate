# CLI local model hash deduplication result, 13 October 2026

Identity: `CLI-02/local-model-hash-dedup-v1`, following the
[frozen maintenance plan](2026-10-13-cli-local-hash-dedup-plan.md). Status:
**passed for the bounded local CLI maintenance slice**. The code candidate was
committed as `f878d7e` before the real checked-model E2E run.

## Change and reason

The CLI-owned local server previously performed a full model SHA-256 read before
launch, another during readiness, and a third in the durable pre-inference
preflight. Readiness already had a parsed server report; it now validates that
report's alias, runtime build, context, canonical model path and file size
through the shared llama.cpp adapter without rereading model bytes or probing
the server a second time. The pre-launch and durable pre-inference full hashes
remain. The external-server CLI path still uses its full checked preflight.

The selected GGUF is 1,133,080,448 bytes. Removing one full readiness hash
removes that amount of model-file reading per fresh local translation or
unvalidated local resume. This is a code-path/I/O count, not a measured
wall-time or disk-throughput improvement. The readiness-only check cannot
authorize inference and does not attest in-memory weights.

## Candidate and checks

- Windows development host, checked Hy-MT2 1.8B Q4_K_M model SHA-256
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`;
  pinned llama.cpp b10977 executable SHA-256
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
  Both local hashes matched the frozen `CLI-01` asset identities before the
  real run.
- `task test:cli:local` passed 3/3, including wrong-model refusal before child
  startup. `task test:verified-server` passed 3/3: the durable checked preflight
  rejected same-size changed model bytes before output, and the metadata-only
  adapter tests rejected wrong alias, build, context, path and size without
  emitting a model-hash operation. `task test:preparation` passed.
- `task check` passed formatting, warning-free Clippy and workspace tests.
  `task plan:check` and `task docs:check` passed on the code candidate.
- After linking this record and marking `CLI-02` done, `task site:build`,
  `task site:check`, `task plan:check` and `task docs:check` passed. Both public
  report pages were regenerated from the canonical backlog.
- `task eval:cli:local:e2e SERVER_EXE=... MODEL_FILE=...` passed one checked
  two-cue SRT and one strict WebVTT invocation. The SRT source/result SHA-256
  values were `e28a722eb38da1a1f3ebb2c941e78697e835ad7cd7d2d2949794f2028dc2746b`
  / `8dffe24484126ef828a48c66b4f8692dca3a7103aeff069c4679693ba4499826`.
  The WebVTT values were `5c89f87be30c903460f70d73d458c84e0cfa02eb83120e23adbc367c2c961bbc`
  / `308b16c249b8621638330441e72575b9d806aa9326575c2ac453d12fd09dc07f`.
  Both result hashes equal the prior `CLI-01` repeatable E2E result. Source
  bytes, cue identity and timing remained intact; occupied outputs were
  refused; validated `resume-local` with missing runtime/model paths exported
  identical bytes offline. The successful temporary directory was removed.

No Chinese adequacy, terminology, clean-install or Auralis desktop gate is
claimed by this maintenance check. No matched elapsed-time comparison was run.
