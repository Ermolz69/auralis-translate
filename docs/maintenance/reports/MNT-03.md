# MNT-03 — Translate provider module responsibilities

Status: committed model-free candidate for receiving review; no release gate is claimed.

| Identity | Value |
| --- | --- |
| Repository | `auralis-translate` |
| Branch | `refactor/translate-provider-modules` |
| Recorded base HEAD | `8a35bfc59ba49c8e5a2e383e740424d49d49a6fc` (MNT-02 candidate and maintenance packet) |
| Tested source candidate HEAD | `b4a7c09219a1e6dc90fa9ac90583a45341ed5304` |
| Tested source tree | `980e4e152a9b150ec4d7b9eb0c48b1b0dd3bbc00` |
| Working directory | `C:\Users\Ermolz\.codex\worktrees\translate-provider-modules\auralis-translate` (isolated managed worktree) |

The report-only commit follows the tested source candidate, so it cannot contain
its own commit hash. The shared `main` checkout's staged backlog and site files
were not touched. Canonical backlog and generated progress remain with the
coordinator. MNT-01 owns final onboarding reconciliation after accepted code.

## Problem and responsibility map

The 827-line `provider.rs` mixed server probing, token admission, line requests,
version dispatch, and the public provider facade. It is now 132 physical lines.
No public signature, request schema, profile, model setting, retry rule, or
journal contract was changed.

| Owner | Responsibility after extraction |
| --- | --- |
| `src/provider.rs` | Provider construction, public `TranslationProvider` implementation, shared response-format choice, request usage parser and narrow module declarations. |
| `src/provider/probe.rs` | Local health, props and model probes, including preparation control and endpoint errors. |
| `src/provider/preflight.rs` | Version-sensitive exact-count versus apply-template/tokenize requests, journaled preflight, and v5 context-budget admission. |
| `src/provider/line.rs` | Legacy line requests and v5/v6 JSON line requests, decoding, protected-text restoration, source guards, diagnostics source flag and line journal order. |
| `src/provider/dispatch.rs` | Profile admission and version selection, line iteration, v7/v8 batch delegation and response assembly. |
| Unchanged `src/provider_v7.rs` | V7/v8 batch sizing, context trimming, splitting, validation and batch journal ownership. |
| Unchanged `src/local_http.rs` | Request transport, timeout, bounded response reads and cancellation. |

The preflight, line and batch owners retain their own begin/finish sequences.
Their restored-candidate semantics and error precedence differ, so combining
them into one journal helper would have obscured behavior. Only the existing
response usage parser remains shared in the facade.

Changed paths are the provider facade; four new files under `src/provider/`;
and `tests/context_v5.rs`. No Taskfile, CLI, Auralis, manifest, migration,
experiment or historical evidence file changed.

## Before/after behavior matrix

| Boundary | Base behavior retained at candidate | Model-free evidence |
| --- | --- | --- |
| Legacy prompt families v1–v4 | Local-only URL, source hash header, legacy prompt/context/glossary forms, Chinese admission and protected-money restoration. | `protocol`, `profile_contract`, `task test:model-profiles` |
| V5/v6 line shape | Same response-format selection, source slots, v6 target binding, exact rendered request and strict untrusted-output rejection. | `context_v5`, `context_v6`, `task test:context-v5`, `task test:context-v6` |
| V7/v8 batch shape | Same target/context ordering, multiline mapping, split/discard behavior, response format and terminal-line handling. | `context_v7`, `task test:long-batch-v7`, `task test:long-batch-v8` |
| Token admission | Checked `b10977-0ecb159c9` build uses one input-token request; other/legacy builds use apply-template then tokenize. Reserve, invalid count and context-removal order are unchanged. | `context_v5`, `context_v7`, `task maintenance:test:provider` |
| Invalid responses | Malformed JSON, wrong slot/identity, leaked JSON structure, truncated body and transient HTTP outcomes retain their errors and journal categories. | `context_v5`, `context_v7`, `protocol`, `request_cancellation` |
| Pause/timeout/transport | The same control polling and bounded HTTP adapter remain in use; pause and retry classification do not move. | `task test:request-cancellation`, `task test` |
| Journal begin/finish | Begin failure still stops before network. A new public-contract test proves finish failure rejects an otherwise valid v5 response after the network call. Request identities, raw bodies, parsed preflight and restored candidates remain in their original sequence. | `v5_does_not_call_model_when_request_identity_cannot_be_saved`, `v5_preflight_journal_failure_stops_before_network`, `v5_finish_failure_rejects_valid_model_response`, `task test:inference-journal` |
| Diagnostic-aware prefix repair | Plain translation still refuses a repair profile; diagnostic-aware calls retain prefix insertion and strict identifier/time guards. | `task test:model-profiles`, `task test` |

The new test exercises the exported provider through `translate_batch`; it does
not expose private helpers. Captured HTTP requests, headers, serialization,
version selection, diagnostic codes, journal event order, result forms and error
strings are protected by the existing public behavior tests listed above.
Timing and random request IDs naturally vary between runs.

## Commits and review size

| Commit | Purpose | Ordinary added/deleted lines | Rename-aware added/deleted lines |
| --- | --- | --- | --- |
| `0a2bad3a54d934062f407d00143e074e207d068c` | Isolate probing. | 40/33 | 40/33 |
| `441485aea1f115e69c50f9dae340d6fe5c4bb15f` | Isolate line requests. | 238/226 | 238/226 |
| `9b23de7d83767733c39db258bcd6cd9f0017b6f8` | Isolate token preflight and v5 budgeting. | 295/285 | 295/285 |
| `b4a7c09219a1e6dc90fa9ac90583a45341ed5304` | Isolate dispatch and add journal finish failure test. | 223/165 | 223/165 |
| `156d4b596c964458ce62f51ff13d95a9dfb9054c` | Record this source candidate and its verification. | 121/0 | 121/0 |

Each source commit compiled and passed `task maintenance:test:provider` before
the next extraction. Ordinary and `-M` counts match because Git did not detect
whole-file renames; these are small function moves. Across the source candidate,
the ordinary diff is 791 additions and 704 deletions in six files. No generated
file changed.

## Verification

All final commands ran from the working directory above against the same source
tree. The code candidate was then committed and the focused provider, formatting
and lint commands reran on its clean committed tree.

| Exact command | Exit | Observed result |
| --- | ---: | --- |
| `task maintenance:test:provider` | 0 | Provider contract suites: 70 passed; SQLite journal/migration suites: 15 passed. Also passed on committed source. |
| `task test:model-profiles` | 0 | Versioned profiles and legacy provider contract passed. |
| `task test:context-v5` | 0 | V5 request, preflight, journal and response tests passed. |
| `task test:context-v6` | 0 | V6 schema and untrusted-output tests passed. |
| `task test:long-batch-v7` | 0 | V7 long-batch tests passed. |
| `task test:long-batch-v8` | 0 | V8 long-batch tests passed. |
| `task test:inference-journal` | 0 | Journal and SQLite persistence checks passed. |
| `task test:request-cancellation` | 0 | Request cancellation checks passed. |
| `task fmt` | 0 | Rust formatting clean; repeated on committed source. |
| `task lint` | 0 | Workspace Clippy passed with warnings denied; repeated on committed source. |
| `task test` | 0 | 97 test suites, 298 passed, 0 failed, 4 ignored by existing asset/performance gates. |
| `task docs:check` | 0 | Links valid across 561 Markdown files at source candidate, then 562 after this report. |
| `task plan:check` | 0 | 59 backlog tasks, unique IDs and linked completion evidence verified. |

Four existing ignored tests require private ASUS review/source inputs or the
bounded PERF-03 workload. They were not promoted into this model-free matrix.
Logs are retained locally under `.cache/mnt03/logs/`. Initial baseline
`task maintenance:test:provider` failed to create Cargo's target directory due
to sandbox access (`os error 5`); the identical approved run passed. An initial
`task lint` rejected `expect_err()` in the new test under the repository's
`clippy::expect-used` rule. The test now matches `Result` explicitly, and final
lint passed. No production-code failure was hidden or gate weakened.

## Boundaries and next action

Public API, protocol, configuration, database schema, profile, prompt bytes,
runtime-build guard and model asset changes: **none**. Documentation's current
provider link still resolves to the public facade. The ownership map in the
current architecture guide is for MNT-01 to reconcile after acceptance.

No model was run and no asset-dependent language, quality, audio, native or
clean-install gate was renewed. The receiving reviewer should inspect the full
base-to-candidate diff, rerun focused checks on the committed tree, compare
negative/error paths and record an `accepted`, `changes_requested` or
`blocked_by_environment` verdict before canonical backlog completion.

The source and report through `156d4b5` were pushed to the verified `origin`
branch `refactor/translate-provider-modules` on 17 October 2026. No PR was
opened. The final report-only status commit is identified in the handoff.
