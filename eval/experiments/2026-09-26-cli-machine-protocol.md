# CLI JSON request, JSON/JSONL progress and checked-model evidence

Date: 26 September 2026. Scope: opt-in machine protocol v1, preserved durable
translation behavior and repeated real Chinese outputs across the same four
authored cues in SRT and WebVTT. Installation, language release and CLI-owned runtime gates remain
open. No model/corpus download or public publication was performed.

## Contract and implementation

[Machine protocol v1](../../docs/reference/cli-protocol-v1.md) defines explicit
`--json` and `--jsonl`, bounded versioned named requests and exit status. It covers
inspection, doctor, durable translate/resume, status/diagnostics/pause and edits.
JSONL flushes registered IDs, model readiness and committed counters before the
terminal event. JSON retains only the latest applicable events in one summary.
Result metadata is emitted after complete export. Exit 3 means a usable complete
`needs_review` file; exit 5 means acknowledged pause. Existing unflagged scripts
keep their output and 0/1 behavior.

The reporting module owns the wire event/envelope, summary and output/error
policy. The document facade accepts a progress port; the core is unchanged.
Expected CLI validation/conflict boundaries now return typed codes; matching
English strings is not used. Provider errors still have one runtime category.
File publication, checkpoint, result revision and model/profile validation rules
are shared with the existing commands. The obsolete standalone stderr-only sink
was removed after moving its legacy behavior into the output adapter.

## Deterministic process tests

`task test:cli:protocol` passed seven integration tests with real CLI processes and
SQLite, plus bounded mock HTTP. They verify:

- Unicode/spaced paths, versioned JSON input, rejection of unknown fields and
  versions, a request exceeding 1 MiB and unsupported machine commands.
- JSONL framing/sequence, initial and committed progress, result identity/hash/
  size and review exit 3 for both SRT and WebVTT; offline JSON re-export and
  existing-output refusal with conflict exit 7.
- Unsupported source rejection before state creation; failed model connection
  with runtime exit 4, retained registered IDs and failed durable state.
- An unanswered ninth request after one saved block, a separately issued JSONL
  pause, exit 5, no partial file/result and only the missing block on resume. The
  full retained checkpoint specification remains identical.
- Export failure after result commit, I/O exit 6 without a successful result
  event, a validated result retained for offline resume, immutable manual
  revision 2 and stale-edit conflict without altering source or earlier output.
  A revision-3 edit whose export fails also retains registered run IDs and the
  committed newest result, which is recovered offline through resume.
- Doctor's hash identity report and model-mismatch exit 7. Its fixture is not a
  valid inference model and does not establish model support.
- Named glossary translation input, frozen revision and persisted advisory
  `glossary_term_missing` diagnostics in machine output.

Initial compilation found stale router calls during the refactor and incorrectly
named checkpoint/error fields in new tests. Correcting them restored compilation;
the final `task check` passed formatting, Clippy and all workspace behavior tests,
including the existing legacy CLI processes. Test helpers remain outside product
modules, and the live CLI test child has failure-path cleanup.

## Real checked-model invocation

`task eval:cli:protocol` passed. It builds the optimized CLI, runs the seven tests,
then invokes the real installed b10977-0ecb159c9 runtime and checked Hy-MT2 1.8B
Q4_K_M model. Absolute `AURALIS_TEST_LLAMA_SERVER` and `AURALIS_TEST_GGUF` paths
pointed to ignored local assets. `AURALIS_TEST_GPU_LAYERS=99` and the existing
local CUDA runtime PATH were supplied; cache RAM was zero, one generation slot
and context 2048. This does not establish a minimum hardware or latency profile.

The source is the [authored setup fixture](../fixtures/clean-windows/setup-probe.v1.json),
with four cues per format, UTF-8 BOM and CRLF. The harness submits a JSON request,
reads JSONL events, requires checked model readiness, one saved block, a complete
result and review exit 3. JSON inspections compare cue identity/timing/order,
text-slot counts and every protected byte span. External and managed source
bytes remain unchanged. Status selects the same validated result. After stopping
the server, JSON resume re-exports exactly the same bytes without model readiness.

Retained local reports, logs, requests, databases and outputs are under ignored
`.cache/eval/machine-protocol-runs/protocol-bWeoqu/`.

| Evidence                             | SRT                                                                | WebVTT                                                             |
| ------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Run ID                               | `84c6e9f1-bae0-47c5-a2f6-cb4fc5d25ab0`                             | `38d657fb-7dd1-4fa2-9489-929dc62aab41`                             |
| Result ID                            | `a4b81c3b-6705-4019-8082-5b1239c5bb8d`                             | `73401899-9b7d-47f4-a9be-cca4abd71ac4`                             |
| CLI wall time after server readiness | 7,028.12 ms                                                        | 7,081.81 ms                                                        |
| Output SHA-256                       | `4599a76c62b8455c71f8f9a21de3f039fc3bd22998a23ec17d28f46229ef32be` | `dcefb9d26759347cb06b1babb374631266b4febb351b8e50d0febc392bd8523b` |
| Report SHA-256                       | `3d617b84520b278bb829583934baeb2b897d15699e663368d97d552ff339a823` | `5bcb4651ba1847926ef2403fb6dd97c41f06f0d748575219a9ff3783b522e0b5` |

Tested CLI SHA-256:
`ed175f2fa331967bc105d99873e0067274556158461c7179d66ab394d644d321`.
Profile SHA-256:
`dba1d341230bc4f1117c6fba8ce55a1127b120864aa8363295bdbc883b98fc3e`.
Model SHA-256:
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.

### Final repeat after edit-export recovery correction

The final `task eval:cli:protocol` passed after adding run identity to edit output
and the revision-3 failed-export case. The harness also checks the stored profile
fingerprint and source digest against the exact input bytes. Retained evidence is
under ignored `.cache/eval/machine-protocol-runs/protocol-eGTNJK/`.

| Evidence                             | SRT                                                                | WebVTT                                                             |
| ------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Run ID                               | `807f170d-727d-4e95-a7ca-ed40e5535324`                             | `226d90a2-e881-46af-b0c1-d23308ba3562`                             |
| Result ID                            | `342ab153-2e21-4534-9b4b-db16aa1fbe64`                             | `c803429f-db2e-4c77-931a-f6b6b7cda01f`                             |
| CLI wall time after server readiness | 7,142.22 ms                                                        | 7,952.99 ms                                                        |
| Output SHA-256                       | `03d53710999b1a02b0c10146aa3788560051d43652ae2b4fca5fe9be593e4ea9` | `dcefb9d26759347cb06b1babb374631266b4febb351b8e50d0febc392bd8523b` |
| Report SHA-256                       | `6862a841c6d19dd21d63f8a6fcc7cd5e129d02ae4c3385ab62d0c27ca92f2648` | `ba7e6d0974219efb844b2c109232351e797ccdf726bb820f2b3175f01c74d3c3` |

Final tested CLI SHA-256:
`8d9c992f6b4bdc33f52badd5971b9523ad2751759584526c4149bb3c725f0763`.
The runtime, model, profile and input identities remain those above. Both final
quantity candidates are `Нам еще нужно 3 коробки.`; the other three cues match
their drafts. Each final run has one accepted block, a validated review-required
result and byte-identical offline re-export. This is a repeat on the same small
inputs, not additional independent linguistic coverage.

## Source/draft/candidate comparison

| Chinese source           | Unreviewed Russian draft                   | Real SRT candidate                         | Real WebVTT candidate                      |
| ------------------------ | ------------------------------------------ | ------------------------------------------ | ------------------------------------------ |
| 列车将在 08:10 出发。    | Поезд отправится в 08:10.                  | Поезд отправится в 08:10.                  | Поезд отправится в 08:10.                  |
| 不要打开这扇门。         | Не открывайте эту дверь.                   | Не открывайте эту дверь.                   | Не открывайте эту дверь.                   |
| 我们还需要 3 个箱子。    | Нам нужны ещё 3 коробки.                   | Нам нужно ещё 3 коробки.                   | Нам еще нужно 3 коробки.                   |
| 请在星期五之前完成检查。 | Пожалуйста, завершите проверку до пятницы. | Пожалуйста, завершите проверку до пятницы. | Пожалуйста, завершите проверку до пятницы. |

Three candidates per format match the draft exactly; the quantity cue has another
Russian construction in both runs. Exact equality is recorded as a comparison
fact, without turning it into an adequacy score or treating wording differences
as failures. The file retains time, negation, quantity and deadline diagnostic
rows for source-aware review. Drafts remain unreviewed, each reviewer is null,
and the report's language verdict remains `not_reviewed`. Four artificial cues
do not provide representative subtitle or Japanese release evidence.

## Open scope

Machine installation/download commands, richer provider error reasons, CLI-owned
runtime, source/glossary orphan cleanup, broader interruption cases and release
quality remain work. Named JSONL pause behavior is verified with mock HTTP;
the [real request-cancellation probe](2026-09-26-request-cancellation.md) separately
covers busy inference using the legacy CLI interface. Machine input/output does
not change Auralis's embedded library integration or close its clean-machine gate.
