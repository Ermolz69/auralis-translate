# REG-061 publication handoff

Date: 3 October 2026 (+03:00). This closes the bounded EVAL-05 screen,
not the overall Goal or the release/audio gates. The target scope transformer
passes deterministic admission checks, but the real terminology candidate is
rejected. Product v8, original subtitles, saved runs and result databases are
unchanged. No 268-cue candidate inference was run.

[Full result, source/model/runtime/profile hashes and limits](2026-10-03-reg-061-target-terms-v1-result.md),
[committed plan](2026-10-03-reg-061-target-terms-v1-plan.md),
[all thirty raw responses](../reports/2026-10-03-reg-061-target-terms-v1.json),
[separate AI meaning review](../reports/2026-10-03-reg-061-target-terms-v1-ai-review.json).

## Commits and checkout boundaries

- Initial actual HEAD / remote main:
  `9340d922aa0d2d20189c8223d42a0b1dcc4eb7db`.
- Implementation, tests, policy, exact-request freeze and plan before inference:
  `b26092fd6949c25e18765eba0349fd7ebebbce21`.
- Retained failure, REG-061 follow-up, new REG-062, catalog v41 and Pages:
  `260452400b39b343efdba4e85fbf001f1f812d37`.
- This final handoff is a separate documentation commit after observed deployment.

Both author and committer were the verified primary global identity
`Ermolz <00ermzahar@gmail.com>`. No global Git settings were changed. The
local/environment identity override check was empty, and commit-scoped values
were restored after use. Only the files listed in this slice were staged.

Publication used the attached worktree
`C:/Users/Ermolz/.codex/worktrees/reg-061-target-terms/auralis-translate`, branch
`feat/reg-061-target-terms`, with a fast-forward `git push origin HEAD:main`.
The original shared checkout remains at `b26092fd...` with ongoing foreign
NAME-01 changes. It was not reset, merged, stashed or cleaned. Its Taskfile and
backlog foreign edits are excluded from this branch. In particular,
`docs/architecture/014-result-history-selection.md` is not in either slice commit;
its original dirty raw bytes remain SHA-256
`28e1d12c1afb4f1640128a2183564f26e119797e9b7f187134f0fd4f2f215aec`.
No Rust crate or product model manifest differs from the initial HEAD in this slice.

## Exact Taskfile commands and observed results

| Command | Observed result |
| --- | --- |
| `task test:target-terms` | 7 deterministic checks pass: target/neighbor scope, mentions/negation/contrast, core/processor/thread and pad/stand distinctions, unchanged source facts and approved_terms, resume identity, token boundary and raw rejection |
| `task eval:regression:reg061:freeze` | All 30 exact requests and identities frozen before model calls; ten unchanged v8 baseline hashes match prior experiment |
| `task eval:regression:reg061:preflight` | Passed as probe prerequisite; archived source/identity, request, policy and one-attempt guard checked |
| `task eval:regression:reg061:probe` | Exactly one attempt, 30 chat replies, 60 actual template/tokenizer checks, no retries or HTTP failures; zero checkpoints/results |
| `task eval:regression:reg061:report` | Raw responses/resources retained; separate AI review yields rejection |
| `task eval:regression:reg061:check` | 7 tests and all frozen requests, usage/budget, raw structure, identities and review checks pass; repeated against committed publication candidate |
| `task test:long-batch-v8` | 8 provider, 16 checked-profile and 5 CLI admission tests pass |
| `task test:inference-journal` | 4 request, 9 migration and 16 provider tests pass; rejected output retained without accepted lines |
| `task eval:regression:check` | Full v41 catalog and existing deterministic guards pass in isolated tree; one existing optional private natural-caption test is skipped by its default configuration, REG-061 private evidence checks pass |
| `task eval:long:v8:asus:single:check` | Existing 1.8B 79/268 failure and 7B 268/268 structural archive verified, no inference |
| `task plan:check` | 50 backlog tasks and six document identities pass; EVAL-05 only is done |
| `task docs:check` | 413 Markdown files have valid repository file links; external URLs/anchors are outside this checker |
| `task site:build` | Current 53,974-byte index and 1,154,069-byte history generated |
| `task site:check` | Pinned evidence, paired rows, current/history links and two-file publication boundary pass |
| `task site:live:check` | Both actual HTTPS pages return 200 and match committed local bytes |

The first Node test invocation failed with `spawn EPERM` before test/model
execution; `--test-isolation=none` was applied and frozen before inference.
Shared-checkout plan/site checks later failed on unrelated NAME-01 phase data,
so publication was isolated without modifying it. The first isolated full
regression invocation stopped on an older harness raw-byte hash changed by Git
line-ending conversion. Restoring exact archived bytes for unchanged evaluation
files resolved it; canonical Git content and hash expectations did not change.
The complete regression command then passed. None of these retries calls a model.

## Observed publication

[Pages deployment 37104891277](https://github.com/Ermolz69/auralis-translate/actions/runs/37104891277)
completed successfully for commit `260452400b39b343efdba4e85fbf001f1f812d37`.
The current report shows the rejection and open gates;
[history](https://ermolz69.github.io/auralis-translate/history.html#reg061-target-terms)
retains all fifteen pairs plus the previous ten-pair provisional-term screen.

Live byte check at `2026-10-03T07:01:25.138Z`:

| Page | Bytes | SHA-256 |
| --- | ---: | --- |
| [Current index](https://ermolz69.github.io/auralis-translate/) | 53,974 | `fd33ce1990824d091a65455eec3a0b3da725dd7719f29a6c75c22baaf44d771d` |
| [History](https://ermolz69.github.io/auralis-translate/history.html) | 1,154,069 | `0031089c68c778285f56f39c8d9a6f1ab32115dee00a86efe3f8da4914d98574` |

The private live report is retained at
`.cache/eval/live-pages-check/attempt-9ec7d5fc-f165-4de6-b83d-470f9560b304/report.json`,
SHA-256 `dc60c503dc55b713516d5f86c42e5e3a607a9e82a03ccc3ed3bb01540e7b826f`.
Browser verification covered actual published text, the fifteen-row table,
previous ten-row disclosure and both current/history transitions. At 1280 and
390 pixels, document widths were 1265 and 375 pixels; the 860-pixel history
comparison table scrolls within its container. Two locator-driven return clicks
hit browser automation deadlines; the fresh accessibility link completed the
return and the current page was verified. These are UI automation observations,
not model failures. Temporary viewport override was reset.

## Decision, limits and rollback

Both original positive concepts are repaired; the original processor-count and
stand negatives remain correct. The scoped arm has twelve AI fact passes, one
failure and two needs_review observations. The new availability contrast changes
an available stand into `коврик-стенд`. All thirty JSON replies are structurally
valid, but the frozen semantic advancement rule fails. There was no prompt
retuning, second model attempt, selectable product profile or candidate full-file
run. Exact failed raw text remains in the evidence, without a checkpoint or
partial subtitle export.

This is visible development evidence. The simple conservative admission policy
is not a general Chinese semantic parser; byte-identical requests do not promise
identical sampled replies. No full reference translations or closed holdout were
sent to the model. ASUS terms were provisional, disclosed to the model, and never
human-approved approved_terms. Resource sampling is approximate and covers one
attempt, not a hardware SLA or a quality estimate.

Runtime rollback requires no action: keep the unchanged v8 manifest with SHA-256
`a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc`
and existing compatible runs. To remove the development/publication slice, use
revert commits on a clean branch in reverse order (this final handoff, then
`2604524...`, then `b26092f...`), resolve only scoped Taskfile/backlog changes and
rerun `task plan:check docs:check site:build site:check`. Preserve foreign edits;
never reset the shared checkout. Original freezes/raw evidence remain available
in the pinned commits and private attempt archive.

Independent Chinese–Russian review is absent. No contact was made. Source
admission, human meaning/term approval, clean installation, listened real audio
and approved spoken script remain open. EVAL-04, CTX-03, RELEASE-05, G3–G9,
A1–A6 and the overall Goal remain incomplete.
