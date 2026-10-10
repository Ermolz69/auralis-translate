# Native historical SRT export probe, 10 October 2026

Identity: `HOST-03/INT-TR03-native-history-export-v1`, following the
[predeclared plan](2026-10-10-native-history-export-plan.md). Status: **passed
for the authored SRT native integration slice**. This does not close `HOST-03`,
G3–G5, G8 or G9.

## Exact candidate and execution

- Auralis `feat/translate-review` commit
  `1f1818eaf77631ef963610073a3443310fb17d61`, with Translate submodule
  pinned to `1b888d0b7eb78a67794445fcbc51eb06329f9b64`. The Translate
  experiment plan was committed as `09b0a94` before this run. These are local
  development commits, not a selected release candidate or installer.
- One `task desktop:e2e:native:translation:history:export` invocation on the
  host Windows x64 development machine from the clean Auralis worktree, with
  the authored two-cue Chinese SRT fixture and no independent holdout. The
  owned sandbox appeared at 2026-10-10 14:49:49 UTC (local UTC+03:00), and
  success was observed before 14:59:12 UTC; the harness did not emit an exact
  process-end timestamp. Both checkpoints were committed at 14:57:10 UTC. No
  repeat model answer was generated. `task media:verify` passed before the
  probe. The preflight found no competing `llama-server` process; the RTX 3070
  had about 1,040 MiB of 8,192 MiB in use before model loading. Peak memory
  was not sampled in this run.
- Checked experimental Hy-MT2 1.8B Q4_K_M GGUF: 1,133,080,448 bytes, SHA-256
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
  Local `llama-server.exe` SHA-256
  `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
  version `0.4.1-dev`, build `10977`, commit `0ecb159c9`. The model/runtime
  manifest and tokenizer identity remain bound by the checked package manifest.
- The native debug build finished in 2m 05s. The full invocation exited zero
  with `Native Tauri history export E2E passed`; the harness removed its owned
  sandbox. No `auralis-app` or `llama-server` process remained afterward.

## Observed result

The actual React/Tauri workflow admitted the source, ran one model attempt,
committed two cue checkpoints, created a corrected second-cue result and a
separate first-cue branch, selected the historical correction, and reopened
the desktop. The accepted model lines were `Здравствуйте.` and `До свидания.`;
they are recorded as trace output, not scored translations.

The database verifier observed exactly three ready result revisions with these
SHA-256 values:

| Revision | Result | Verified output SHA-256 |
| --- | --- | --- |
| 1, original model result | `d2258fa7-afb5-4a85-9fbe-42609ccccd72` | `8646bcb2f3e1d0feffdd8df43cb83a5cc2e9aa12ba976a36ec50b995de60107e` |
| 2, selected historical correction | `4eb54ec8-8e8d-4ad0-83cc-4e3b3b0f8d50` | `429f38bbdf7ec7573fae9d232eec5755e731f21dcb12706ad570636420c9852a` |
| 3, older-base branch | `36b95726-f137-4798-985f-27901dc03fe1` | `94a450a310da9191d7bd8b234469332b5345cf978eaca5eaa2c9f819688b2f20` |

The native UI exported revisions 2 and 3 through the real IPC command. After
process restart it retried revision 2 to the already occupied path and wrote a
new offline re-export. The independent verifier compared each export byte for
byte with its managed artifact and its recorded digest. It found only the
declared source video, original SRT and export files in the fixture directory,
with no staging residue. Both databases retained the selected result, all
three publications, edit provenance and the two committed checkpoints. The
verifier found one model attempt and zero review-decision events. The original
source remained immutable under the scenario's source checks.

## Checks and limits

- `task desktop:e2e:native:translation:history:export:check`: passed, including
  syntax checks and the negative export verifier case.
- `task desktop:e2e:native:translation:history:export`: passed once, model
  backed, with exact export verification before and after process restart.
- Before the run, Auralis also passed `task fe:typecheck`, `task fe:lint`,
  `task fe:build`, `task q:file-size`, `task q:format-check`,
  `task q:ipc-contract`, `task q:desktop-policies`, `task docs:check`,
  `task rs:fmt` and `task rs:clippy:native-e2e` for this native scenario.

This probe used an authored two-cue SRT, a development build and a locally
available model. It did not exercise WebVTT native export, a target subtitle
consumer, an installed offline package, a clean Windows machine, a natural
source-aware holdout or independent Chinese/Russian review. It therefore
advances `HOST-03` and `INT-TR03` without closing their remaining acceptance
work. The [resource record](2026-10-10-desktop-goal-resource-availability.md)
documents the unavailable independent reviewer and clean Windows target.
