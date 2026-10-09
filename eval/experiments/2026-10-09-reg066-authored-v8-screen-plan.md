# REG-066 authored v8 fact-control screen

Date: 9 October 2026. Freeze this plan, the 20-request identity file and the
Taskfile harness before inference. This is an `EVAL-04`/`CTX-03` development
screen, not a sealed holdout or release rating. The prior
[Vivo copy recovery](2026-10-09-vivo-reg065-copy-recovery-result.md) supplied
five exact paired v8 fact/language risks. The versioned
[REG-066 pack](../regressions/reg-066-vivo-v8-cross-model-facts-v1.json)
adds five related and five negative Chinese controls authored for this screen.

## Frozen comparison

- The ten authored cases are known development data. Five related cases test
  9400 generation, 36-month planning, a team spanning two subtitle cues,
  02:00–03:00, and future products. Five negative cases explicitly license
  first generation, 36 months after start, money **and** people, 23:00–00:00,
  and products already available. Human review remains zero.
- Build one four-slot request for each case. Place a single focus slot at a
  rotated position 1–4 with three fixed neutral authored slots; the team
  case uses two adjacent target slots. No source-context cue, term hint,
  Russian reference or expected meaning enters the prompt. Preserve the v8
  target-first instruction, JSON schema and sampling parameters from the
  pinned original-platform Vivo run. Target source fields and timing are
  synthetic, source context is deliberately empty, and model alias plus
  explicit seed 101 are the other declared differences.
- Pair Hy-MT2 1.8B Q4_K_M SHA-256
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`
  with 7B Q4_K_M SHA-256
  `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`.
  Manifest SHA-256: `1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f`
  and `c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`.
  Runtime SHA-256:
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
  Original natural-run report SHA-256:
  `84a737e1cc8c7b468ea66718f2507882929344f259d7824d9071953d24c1a5b5`.
  The prompt prefix SHA-256 is
  `1b4a2ae96e2526a2d096d41cd94215428d87e30db7ab614a222e65b6baac8ebb`.

Use one server per model, one request per case per model: **20 chats**,
**20 apply-template and 20 tokenize preflights**, two server starts, one
seed, zero model retries, maximum 100,000 prompt-plus-completion tokens,
120 seconds per request and 12 minutes total. A pre-spawn permission failure
may be retried once with the same frozen inputs only after recording the
zero-call failure. Any other error or budget exhaustion is retained and
ends the screen. Save all raw requests/replies and resource samples privately.
Publish only source-free identity and descriptive results.

The outcome measure separates JSON/slot validity from source-aware AI triage.
Each focus output is categorized `fact_preserved`, `major_fact_error` or
`needs_review`; Russian grammar is recorded separately. Compare same case
and seed for both models. Do not choose a winner from ten authored cases or
infer long-file adequacy. A candidate fact guard or prompt change needs its
own frozen paired screen with **no new major errors on negative controls**
before any product promotion. Original 467-cue drafts remain unchanged.
