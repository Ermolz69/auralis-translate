# Developer guide

This is the short path through the current experimental translator. The
[product plan](PRODUCT_PLAN.md) defines file invariants, the
[canonical backlog](IMPLEMENTATION_BACKLOG.md) owns task state, and the
[release map](RELEASE_ACCEPTANCE.md) defines gates. The
[document map](DOCUMENT_MAP.md) separates current contracts from dated evidence.

## Setup and first check

Use the pinned Rust toolchain in `rust-toolchain.toml`, Task and Node.js. Cargo
commands in the Taskfile use `--offline`; dependencies must already be cached.
Run from the Translate repository root:

```text
task docs:check
task plan:check
task cli -- inspect crates/auralis-translation-formats/tests/fixtures/plain.srt
```

These commands use repository files and no model. `task docs:check` checks local
file links, not anchors or external URLs. `task plan:check` verifies backlog IDs,
states, dependencies and document identities. `inspect` reports the strict source
subset before inference. Use `task cli -- inspect-vtt PATH_TO_SOURCE.vtt` for a
WebVTT file. Unsupported syntax is rejected; a `.vtt` extension alone does not
promise every WebVTT feature. `task check` adds formatting, Clippy and workspace
tests on synthetic fixtures/mock providers. Its success does not pass a language,
real-model, native desktop or clean-install gate.

## CLI translation and recovery

The [machine/positional protocol](reference/cli-protocol-v1.md) defines arguments,
JSON/JSONL output and exit behavior. Choose one server ownership path:

| Path | Commands | Prerequisites and ownership |
| --- | --- | --- |
| Caller-supplied server | `translate`, `translate-vtt`, `resume` | Start an installed, checked loopback llama.cpp server separately; supply its endpoint and profile. The caller owns its lifecycle. |
| CLI-owned server | `translate-local`, `translate-vtt-local`, `resume-local` | Supply the checked profile, existing `llama-server` executable, model file and GPU layer count. The CLI starts and stops its child for the run. It does not download assets. |

For example, with a separately started server and locally supplied assets:

```text
task cli -- translate SOURCE.srt STATE_DIR PROFILE.json http://127.0.0.1:18080/ OUTPUT.srt
task cli -- status STATE_DIR RUN_ID
task cli -- diagnostics STATE_DIR RUN_ID
task cli -- pause STATE_DIR RUN_ID
task cli -- resume STATE_DIR RUN_ID PROFILE.json http://127.0.0.1:18080/ RESUMED.srt
```

For CLI-owned process startup, use `task cli -- translate-local SOURCE.srt
STATE_DIR PROFILE.json SERVER_EXE MODEL_FILE GPU_LAYERS OUTPUT.srt`; the WebVTT
and resume variants have the argument order in the protocol. `resume-local` can
re-export an already validated result without starting a server. Keep `STATE_DIR`
and output paths in owned temporary or ignored application data, not under source
fixtures. The original is immutable; output is a separate file and an occupied
output is refused. Inspect `status` and `diagnostics` after interruption, then
resume with the matching frozen source/profile. Only validated durable
checkpoints count as saved progress. See the [storage lifecycle](architecture/002-storage-and-lifecycle.md)
and [CLI interruption acceptance](../eval/experiments/2026-10-10-cli-local-runtime-result.md)
for the tested limits.

Package `fetch-*` and `install-*` commands may access the network or local
model/runtime assets, but do not run translation. `task test:cli:local` uses
model-free refusal/process fixtures. `task eval:cli:local:e2e SERVER_EXE=...
MODEL_FILE=...` runs the real checked model and is opt-in. Never infer a quality
or installation claim from a mock or a package receipt.

## Crate ownership and embedded use

The [actual module map](architecture/004-rust-code-architecture.md) starts with
the core domain/application, strict SRT/WebVTT formats, Translate SQLite,
llama.cpp provider, CLI composition and separate evaluation tool. Auralis links
the Rust crates through its pinned `modules/auralis-translate` submodule; its
adapter supplies project/artifact storage, host jobs and the managed model child.
It does not invoke the standalone CLI or let the UI access Translate SQLite.
The [integration contract](architecture/003-auralis-integration.md) explains both
composition roots and the two-database publication boundary. Change the Auralis
gitlink only in a separately accepted integration assignment.

## Contributing and debugging

Read [AGENTS.md](../AGENTS.md), the [agent workflow](AGENT_WORKFLOW.md) and the
relevant architecture/format contract before an edit. Choose a stable backlog ID,
record its scope and acceptance evidence, and use Taskfile commands for checks.
Tests belong under each crate's `tests/`; retain real failures and old experiment
identities. For failures, inspect the declared source subset first, then profile
and model preflight, run status/diagnostics and checkpoint identity. A resumed
attempt must reuse the frozen source and profile; do not erase its state to make a
test pass. [Regression policy](evaluation/008-regression-and-adversarial-checks.md)
and [published-reference review v2](evaluation/011-published-reference-review-v2.md)
govern quality claims. The public report is generated from the backlog and frozen
evidence with `task site:build` and checked with `task site:check`; a local build
does not deploy Pages.
