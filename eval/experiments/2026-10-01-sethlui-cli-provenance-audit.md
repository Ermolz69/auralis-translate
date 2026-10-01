# Restaurant CLI provenance correction

Date: 1 October 2026. This corrects the interpretation of the
[full-file model screen](2026-10-01-sethlui-full-v6-model-comparison-result.md)
and [copied continuation](2026-10-01-sethlui-7b-copy-resume-failure.md), not a
new model run. Both experiments pinned release CLI SHA-256
`82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d`.
Its recorded filesystem modification time was 30 September 2026 04:12 UTC,
before source commit `6e24b8265ba693328b639f1a3e0ad505bbd7b82a`
(30 September 2026 13:40:11 UTC) introduced the provider-level
`target_text_json_tail::reject_leaked_json_tail` check. A modification time
alone cannot certify compiled inputs, and no original binary build receipt
exists. Thus the old runs **cannot be credited to the newer provider check**.
Their recorded failure was SRT grammar rejection of the invalid translated
line. Raw responses, checkpoint counts and no-output conclusions remain valid;
the old evidence is not relabeled as a test of the new guard.

The exact two real 7B suffix shapes from cues 62 and 100 are now additional
cases in `crates/auralis-translation-llamacpp/tests/context_v6.rs`, beside
ordinary punctuation controls. `task test:context-v6` passes on current
source, including provider rejection. `task build:release` rebuilt the
current CLI; its local SHA-256 is
`09dcb3cd9697529ad583b0aeac68dc6c2a8c06ae17e4bd5596c5eab70e4f7f62`.
This binary has not been run on either natural file, so no full-file runtime
quality or recovery claim follows. The previous frozen preflights correctly
reject this different SHA and stay pinned to their historical runs.

Before the next real-model experiment, freeze a separate binary identity,
the producing source commit/tree and build receipt alongside the profile and
model hashes. `task eval:cli:build:receipt` runs the guard tests, builds the
release CLI, and records an immutable private receipt. Its follow-up checker
rejects changed tracked source, a changed source-file tree (including added
files), or a changed executable; `task eval:cli:build:receipt:test` covers
the source/binary identity controls. The first receipt attempt failed after a
successful build because Node's child `git` spawn returned `EPERM` in this
sandbox; it produced no receipt. The corrected recorder reads the source tree
and Git HEAD directly and lets Taskfile run the tracked-source diff. The
receipt documents the sequential local build procedure, not a
reproducible-build proof. Run it
before predeclaring new inference. Retain the failed old experiments rather than
rewriting their identity or spending their exhausted continuation budget.
