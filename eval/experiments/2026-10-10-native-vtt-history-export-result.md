# Native historical strict WebVTT export probe, 10 October 2026

Identity: `HOST-03/INT-TR03-native-vtt-history-export-v1`, following the
[predeclared plan](2026-10-10-native-vtt-history-export-plan.md). Status:
**passed for the authored strict WebVTT native integration slice**. This is
separate from the [SRT result](2026-10-10-native-history-export-result.md).
It does not close `HOST-03`, G3–G5, G8 or G9.

## Exact execution

- Auralis `feat/translate-review` commit
  `5de282373f6fc0af6143c30c9942a949a530d836`, clean worktree, with
  Translate submodule pinned to `1b888d0b7eb78a67794445fcbc51eb06329f9b64`.
  The Translate plan was committed as `1d602a3` before model admission. These
  are local development identities, not the final candidate or installer.
- One `task desktop:e2e:native:translation:history:export:vtt` invocation on
  the Windows x64 development host with the authored two-cue Chinese strict
  WebVTT fixture. Full terminal output was retained in the Auralis worktree at
  `.cache/evidence/native-vtt-history-export-2026-10-10.log` (9,603 bytes,
  SHA-256 `e6a6ddae6cdbb8583bb72057fed265edd7c37c0b0d684b5f6477d745a3ee8751`).
  The log file existed from 2026-10-10 15:06:43 to 15:12:45 UTC (local
  UTC+03:00); these file timestamps bound the run but are not precise process
  start/end instrumentation. The native debug build finished in 28.16s. The
  invocation exited zero and its owned sandbox was cleaned.
- Checked experimental Hy-MT2 1.8B Q4_K_M GGUF, 1,133,080,448 bytes, SHA-256
  `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
  The pinned manifest names model revision
  `a0c709d9fac510f2c807aa3af52872340dc37a4a`. Local `llama-server.exe`
  SHA-256 `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
  version `0.4.1-dev`, build `10977`, commit `0ecb159c9`. The checked manifest
  pins prompt settings; tokenizer metadata was not independently fingerprinted.
  Before the run,
  no competing model process was found and the RTX 3070 reported 1,049 MiB of
  8,192 MiB in use. Peak resource use was not sampled. No `auralis-app` or
  `llama-server` process remained afterward.

## Observed result

The actual React/Tauri path created one model run with two committed cue
checkpoints. It kept three ready immutable versions: the model result, a later
second-cue correction, and an older-base first-cue branch. The model returned
`Здравствуйте.` and `До свидания.`; these are trace values, not a quality score.
The selected historical correction remained attached after desktop restart.

| Revision | Result | Verified output SHA-256 |
| --- | --- | --- |
| 1, model result | `1917218b-9aa8-4d07-b6dd-a545a62b9c74` | `0e8b5f797d208f7772e889bf340241b0f37c957ff34b7ec91d04c8abe50c164f` |
| 2, selected historical correction | `89cb0d0a-76db-49e2-943e-86c2141a3d21` | `d48ebd268a4101c84f3fdf30071d3679f0ff1ff6ec4be621ea68ddde2965f10d` |
| 3, older-base branch | `645d0eb7-d929-482f-a87d-f8987acbdc27` | `d7b5340c04a93909ec6a7404d36d97032d100b85ac4ede549215639973b67f47` |

The native UI exported revisions 2 and 3 to `.vtt` files via IPC. After
desktop restart it retried revision 2 to its occupied path and re-exported to
a new path. Independent verification compared every export byte and SHA-256
with its managed artifact. It verified the `WEBVTT` header, provenance `NOTE`,
CRLF separators, both timings, cue order, and that manual edits changed only
their chosen text slots. The original WebVTT matched the external source in
both databases and its digest remained unchanged. The selected link, three
publications, edit provenance and two checkpoints survived restart; the run
recorded one model attempt and zero review-decision events. The fixture
directory contained only the declared source video, source subtitle and
exports, with no staging residue.

## Checks and limits

- `task desktop:e2e:native:translation:history:export:check`: passed three
  tests, including changed export bytes, staging residue and altered protected
  WebVTT timing.
- `task desktop:e2e:native:translation:history:export:vtt`: passed once with
  real model inference and exact pre/post-restart export verification.
- `task fe:typecheck`, `task fe:lint`, `task fe:build`, `task q:format-check`,
  `task q:file-size`, `task q:desktop-policies`, `task docs:check` and
  `task media:verify`: passed on the Auralis worktree before the model run.
  Initial sandbox attempts for Node child-process and media execution failed
  with `EPERM`; the same checks passed outside that sandbox before admission.

This probe did not test a target subtitle consumer, installed/offline package,
clean Windows machine, natural source-aware holdout or independent
Chinese/Russian review. The SRT and WebVTT native export slices are now
recorded, but G8 consumer opening and the other release gates remain open.
The [resource record](2026-10-10-desktop-goal-resource-availability.md)
documents the unavailable independent reviewer and clean Windows target.
