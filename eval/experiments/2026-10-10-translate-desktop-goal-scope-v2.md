# Translate desktop goal scope v2

Frozen: 10 October 2026. Canonical planning task: `PLAN-03`. This supersedes
[scope v1](2026-09-28-goal-scope-v1.md) only for this execution goal. The earlier
record and its evidence remain intact. The owner's 10 October desktop scheduling
request adds the native endpoint and strict plain-WebVTT to the required scope;
the audio pilot in v1 belongs to a separate goal and is excluded here.

## Selected endpoint and invariants

- Chinese source subtitles to a separate Russian result in Auralis on Windows
  x64, with the standalone Translate CLI still supported. Both plain-SRT and
  strict plain-WebVTT require their own applicable release evidence. Unsupported
  grammar is rejected before inference; accepted cue identity, timing, settings,
  protected bytes and source files remain unchanged.
- Auralis calls the existing Translate Rust libraries through
  `adapters-translate`, owns host jobs and managed artifacts, and retains separate
  project and Translate SQLite databases. Model inference stays in its managed
  process under shared machine admission.
- A selected result marked `needs_review` is a draft. Speech export requires an
  explicit review decision bound to the exact result digest. A descendant edit
  needs its own decision; the earlier result and review history remain immutable.
- The model, profile, backend, tokenizer and numeric G6 resource SLA are **not
  selected**. `DECIDE-01` must select them from retained, source-aware comparisons
  before a release candidate can be frozen. Historical 1.8B/7B profiles and raw
  failures remain reproducible; this record does not authorize training, a new
  model or an unbounded inference run.
- Japanese, further grammars, ASR, TTS/audio gates A1–A6, Marker and WPF are
  excluded. No audio process is needed for this goal.

## Required task and gate bindings

| Integration gate | Canonical Translate tasks | Required observation |
| --- | --- | --- |
| `INT-TR01` library | `BASE-01`, `CTX-02`, `LONG-05`, `RELEASE-02` | CLI and Auralis share the core; each grammar preserves source and output structure and rejects unsupported input. |
| `INT-TR02` durability | `HOST-01`, `LONG-05`, `HOST-04`, `RELEASE-02` | Pause, cancel, death, stale attempts, resume, edits and both database publication gaps recover on retained fixtures and native runs. |
| `INT-TR03` desktop | `HOST-01`, `HOST-03`, `HOST-04`, `RELEASE-03` | Native import, inspect, start, saved progress, pause/resume, paged history, edit, select, review and immutable export work on isolated real data. |
| `INT-TR04` language | `DATA-03`–`DATA-05`, `EVAL-01`–`EVAL-04`, `CTX-02`–`CTX-04`, `LONG-01`–`LONG-06`, `DECIDE-01`, `RELEASE-01`, `RELEASE-02`, `RELEASE-04`, `RELEASE-05` | A frozen Chinese candidate passes G1–G9 for both formats, including source-aware natural long-file and independent holdout review. |
| `INT-TR05` delivery | `HOST-02`–`HOST-04`, `RELEASE-03`, `RELEASE-05` | The exact committed pin installs on unseeded Windows, explicitly acquires a verified model, restarts and translates/exports offline without a checkout. |

The [release acceptance map](../../docs/RELEASE_ACCEPTANCE.md) remains authoritative
for G1–G9. The exact gate bindings for this expanded endpoint are:

| Gate | Required tasks | Evidence needed for the final candidate |
| --- | --- | --- |
| G1 | `LONG-05`, `RELEASE-02` | 100% supported SRT and WebVTT slot/byte mapping; immutable originals. |
| G2 | `CTX-05`, `RELEASE-02` | Every source slot has an explicit outcome; no partial result publication. |
| G3 | `DATA-04`, `DATA-05`, `RELEASE-01` | At least 95% of eligible independently reviewed holdout cues score at least 4/5. |
| G4 | `EVAL-01`, `RELEASE-01` | Zero unresolved critical holdout errors after source-aware adjudication. |
| G5 | `CTX-03`, `RELEASE-01` | At least 98% of applicable independently approved terms, with name/money controls. |
| G6 | `LONG-06`, `RELEASE-02` | Numeric SLA frozen after profiling and measured on declared hardware/backend. |
| G7 | `HOST-01`, `HOST-04`, `LONG-05`, `RELEASE-02` | Declared fault and migration matrix preserves checkpoints, edits and lineage. |
| G8 | `RELEASE-02`, `HOST-03` | Both formats reparse, open in declared consumers and re-export offline. |
| G9 | `HOST-02`, `HOST-03`, `RELEASE-03` | Unseeded Windows native install, explicit acquisition, restart and offline translation/export. |

The `INT-TR01`–`INT-TR03` engineering checks support these gates but cannot stand
in for G3–G5 language review or G9 installation. `RELEASE-05` audits one committed
candidate and the same corpus/profile/endpoint identities across all gates.

## Baseline and bounded execution

After `git fetch origin` on 10 October, Translate `origin/main` is `4b178fc`.
The independent `main` checkout remains at `b26092f` with uncommitted name and
term work. This goal's isolated `feat/translate-readiness` branch starts at
`4b178fc`; it does not discard that work. Auralis is at local `d962025`, includes
its fetched `origin/main`, has unrelated historical-edit changes, and pins the
separate Translate submodule at `1b888d0`. The pinned library is therefore not
the sibling's current code. Commit and test Translate before deliberately moving
that pin and testing Auralis. Neither dirty checkout is a release identity.

Model-free tests and documentation checks run first. Model loading, inference,
rendering and model doctors run sequentially only after machine-wide admission
and process ownership are established. Every new comparison freezes input/split
hashes, profile/runtime identities, seeds, request/token/time limits and stopping
criteria in its own experiment record before execution. No cloud, paid corpus,
training or rented hardware budget has been authorized. On 10 October,
`nvidia-smi` reported an RTX 3070 with 8,192 MiB total and 714 MiB in use,
driver 595.79; `rustc` 1.95.0, Node 24.14.0 and Task 3.50.0 were present.
These observations do not identify a selected runtime build or measure available
model memory. Runtime identity needs fresh verified evidence before a real-model
claim.

External prerequisites remain a rights-admitted development set, an independent
Chinese/Russian reviewer and adjudicator for disputes, a sealed eligible holdout,
and an unseeded Windows target. Until those are available, `DATA-03`/`DATA-04`,
`RELEASE-01`, `RELEASE-03` and `RELEASE-04` cannot pass. Independent engineering
work continues while their gates stay open.
