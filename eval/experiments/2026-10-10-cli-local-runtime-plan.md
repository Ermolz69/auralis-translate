# CLI-owned local runtime integration plan, 10 October 2026

Identity: `CLI-01/INT-TR01-local-runtime-v1`. This engineering probe responds
to the owner's requirement that one standalone CLI invocation can translate a
file and exit, while Auralis continues to call the reusable Rust crates
directly. It does not assess Chinese translation quality or release readiness.

## Frozen implementation and checks

- Add positional `translate-local`, `translate-vtt-local` and `resume-local`
  commands. Keep existing `translate`, `translate-vtt` and `resume` as
  externally served alternatives.
- Use the existing checked profile and durable CLI workflow. Before inference,
  verify model bytes and server identity. Own the loopback server child for the
  command lifetime, then terminate it. Preserve immutable source, separate
  complete output, checkpoints and machine event semantics.
- Run `task build`, `task fmt`, `task test:cli:local`, `task docs:check` and
  `task plan:check`. Use `task build:release` and `task cli:release` for the
  second format after the same candidate's debug SRT run, because hashing the
  GGUF three times in debug mode consumes several minutes. Inspect process
  cleanup and exact output structure.

## Bounded real-model probe

- Windows x64 development host, local checked Hy-MT2 1.8B Q4_K_M profile at
  `models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json`, SHA-256
  pinned in that file. Use the existing local llama.cpp b10977 runtime and
  GGUF from the sibling Translate checkout. Preflight SHA-256 values:
  model `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`;
  executable `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
- Authored two-cue SRT and strict WebVTT fixtures have the Chinese lines
  `你好。` and `再见。`; they are engineering fixtures, not licensed natural
  quality data. Their CRLF UTF-8 bytes are frozen in ignored
  `.cache/eval/cli-local-runtime-v1`; SRT SHA-256
  `17d8ba2b869d4f4a6ae29fbc7d16f0cf0230ba0ff8e1884c19817b68e7921921`,
  WebVTT SHA-256
  `050f00531fbe714aa2f183e75cdb604a91fad9ac07b251e01d5e721af19bd175`.
- At most one normal model attempt per format after a passing preflight.
  If a code or harness defect prevents reaching inference, retain the failed
  observation, repair it and permit one replacement run per affected format.
  Stop on model rejection; do not regenerate for a preferred wording.
- Require one CLI invocation per format to launch and stop the server, produce
  a separate complete output, preserve timing/cue identity/source bytes, and
  leave no child process. Verify a second invocation against an occupied output
  refuses overwrite before server startup. Retry one validated result through
  `resume-local` with absent server/model paths; it must export identical bytes
  without new inference or a child process. No clean-install or language gate
  passes from this development-host probe.
