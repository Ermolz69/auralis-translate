# Auralis selected-script revalidation guard

Date: 29 September 2026. Partial `VOICE-01` evidence from the local Auralis
worktree `feat/real-tts-pilot` at commit `770760a`. This commit remains local;
the Auralis parent has unrelated unpushed history, so this record does not
claim an upstream Auralis publication or update Translate's submodule pin.

The Auralis application handoff now retains the verified Translate run ID.
`ReverifyPreparedSpokenScriptUseCase` reloads the ready historical result and
managed source/output through the existing two-database verifier, then compares
the current selection and project, translation, run, result, artifact and
source/output identities to the immutable prepared script. The new integration
fixture uses temporary Auralis and Translate SQLite databases. It accepts a
current script, rejects it after selecting another ready result, accepts it
after reselection, and rejects a changed managed test source.

Observed Auralis commands:

- `task voice:handoff:check`: 3 voice unit, 8 historical editing and 1 new
  SQLite revalidation tests passed.
- `task voice:handoff:lint`: application all-target Clippy passed with denied
  warnings.
- `task rs:fmt`: passed after `task rs:fmt-write` fixed an import order.
- `task docs:check`: 5 checker tests and 33 Markdown files passed. The first
  sandbox invocation failed to spawn the Node test worker (`EPERM`); the
  permitted retry succeeded. A broken evidence link was corrected before the
  final pass.
- `task docs:lint`: did not complete because required pnpm packages were
  unavailable locally and the registry connection was refused. The retrying
  process was stopped; no Markdown lint pass is claimed.

This is a callable pre-synthesis guard, not a production worker invocation or
a durable approved-script artifact. Selection may change after its read, so
future media publication must check the selected result atomically. Fixture
reviewer labels are synthetic. Licensed natural input, human Chinese/Russian
review, meaning-preserving speech adaptation, timing fit, listening and
target-player playback remain required for A1–A6.
