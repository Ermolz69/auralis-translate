# Agent instructions for Auralis Translate

Read [docs/README.md](docs/README.md), the [English product plan](docs/PRODUCT_PLAN.md), the relevant architecture document, and the current repository state before changing code. Use [docs/IMPLEMENTATION_STAGES.md](docs/IMPLEMENTATION_STAGES.md) as the temporary stage gate until it is replaced by a tracked implementation backlog. The Russian root plan is historical; the later decisions in `docs/` govern the first file-based MVP where they differ.

## Scope and invariants

- Translate an existing subtitle file into a separate Russian file. Keep the original immutable and available for the project lifetime.
- Inspect and reject unsupported syntax before inference. Extract only declared text slots; preserve supported timing, cue identity, order, and protected bytes.
- Treat model output as untrusted. A checkpoint is saved only after validation and durable persistence. Do not publish partial results.
- Translate SQLite owns runs, checkpoints, edits, and results. Auralis owns projects, host jobs, project links, and managed artifacts. Keep cross-database operations idempotent and recoverable.
- Do not claim language, format, model, or hardware support from mocks or compilation alone. Record real evidence for each stage gate.

## Rust and repository conventions

- Keep the dependency direction in [the Rust architecture](docs/architecture/004-rust-code-architecture.md). Core/domain code must not depend on SQLite, Tauri, HTTP, filesystem paths, or a particular model.
- Give a module one responsibility. Prefer one primary public type or operation per file. Keep `lib.rs` and `mod.rs` focused on declarations and public exports; split a growing concept into a directory before it becomes a large mixed file.
- Place behavior tests under each crate's `tests/` directory and shared test builders under `tests/support/`. Keep test code out of production modules.
- Use typed IDs, statuses, errors, and validated configuration. Keep format grammar constants local to their adapter; put operational limits in configuration and model-specific settings in versioned manifests. Avoid unexplained literals and catch-all `utils.rs` or `constants.rs` files.
- Write documentation, code comments, and commit messages in English. Add comments only where the code cannot explain a non-obvious invariant or workaround.
- When a Taskfile command exists, use it for builds, formatting, linting, tests, and CI. Add an appropriate task before introducing an ad hoc project command.

When reporting a stage, state what changed, the exact `task ...` checks run, the observed result, and any open limitation. If an agreed contract changes, update the documentation and record the reason before treating the new behavior as complete.
