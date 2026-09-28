# Predeclared real scene-context smoke

Status: predeclared 28 September 2026, before model inference. This is a
development comparison, not a quality gate or a sealed holdout.

- Source: authored, unreviewed `p01` (pronoun) and `s01` (split negation)
  relevant scenes from `context-contrasts-v1.json`. Each arm translates the
  identical complete SRT file. References/expected facts are kept in the
  report only, never the request. One repetition per arm and scene.
- Arms: original no-context v5 manifest versus the separately versioned
  one-previous/one-following scene profile with 2,048 token context,
  256 response tokens and 64 safety tokens. Same Hy-MT2 1.8B Q4_K_M model
  revision `a0c709d9fac510f2c807aa3af52872340dc37a4a`, GGUF SHA-256
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`
  and pinned llama.cpp build `b10977-0ecb159c9`.
- Budget: at most four file runs, twelve model chat requests, forty total
  loopback HTTP requests, ten minutes after readiness and one startup.
  No paid compute or model changes. Stop on structural, token endpoint,
  source-immutability, resume or publication failure and retain raw logs.
- Evidence: source/profile/CLI/runtime hashes, scene map, exact prompt and
  raw model replies, accepted target text, server usage, actual preflight
  counts, elapsed times, approximate resource samples, failed attempts and
  offline re-export. AI source-aware analysis is separate from any human
  review. This tiny probe cannot establish context improvement.

The Taskfile entry `task eval:context:scene:smoke` is the sole run command.
