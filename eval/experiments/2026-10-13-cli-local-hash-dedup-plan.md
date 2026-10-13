# CLI local model hash deduplication plan, 13 October 2026

Identity: `CLI-02/local-model-hash-dedup-v1`. This maintenance slice changes only
the CLI-owned checked-server readiness path. The accepted `CLI-01` result remains
an immutable baseline, including its observed three model hashes.

## Contract and bounded comparison

- Keep the first full SHA-256 check before the server child starts and the durable
  full SHA-256 checked preflight before inference. At readiness, validate the
  already probed report's model path, file size, alias, build and context without
  hashing. The adapter remains the single owner of report validation.
- Preserve the existing CLI arguments, error/progress records, original source,
  checkpoint and separate-output behavior. An already validated `resume-local`
  still exports without starting a model server.
- Use the checked Hy-MT2 1.8B Q4_K_M profile with model SHA-256
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`
  and pinned llama.cpp b10977 runtime on the Windows development host. Verify
  actual local assets before inference. The 10 October `CLI-01` result is the
  historical baseline; no language-quality or elapsed-time improvement is
  inferred from a source-level reduction in model reads.
- Use the existing authored two-cue Chinese SRT and strict WebVTT fixtures, one
  real checked-model invocation per format, GPU layers 99, and the unchanged
  checked decoding/profile. Each command has a 600-second harness timeout. Stop
  on any model or structural failure; allow a replacement run only to repair a
  recorded harness defect. No natural or held-out source is involved.

## Acceptance

- Focused tests reject a wrong pre-launch digest without a child or run state,
  reject wrong ready-server metadata, and reject a same-size changed model at
  the durable full preflight before inference or output.
- Run `task test:cli:local`, `task test:verified-server`,
  `task test:preparation`, `task check`, `task plan:check`, `task docs:check`,
  `task site:build`, and `task site:check` on the candidate. The existing
  `task eval:cli:local:e2e SERVER_EXE=... MODEL_FILE=...` must pass both formats,
  source immutability, occupied-output refusal and byte-identical offline export.
- Record the checked candidate commit, exact task outcomes, actual asset hashes
  and any failed run. Count the removed full model read as one selected model
  file size per fresh local command; report wall-time change only from a separate
  matched measurement. Do not treat this engineering result as G3-G5 or G9.
