# Goal scope and regression planning audit

Status: local planning/report verification passed, 28 September 2026. No Goal is activated
and no model, training, migration, fuzz or audio experiment is executed here.

## Gaps and additions

The first delivery plan covered context and full-file quality but needed a finite
completion contract, gate-to-task mapping, permanent regression maintenance,
bounded retry/review behavior, safe upgrade/rollback and a final candidate audit.
Added [release acceptance](../../docs/RELEASE_ACCEPTANCE.md),
[regression policy 008](../../docs/evaluation/008-regression-and-adversarial-checks.md)
and a [reusable goal objective](../../docs/GOAL_PROMPT.md). The backlog adds eight
stable IDs (PLAN-02/03, DATA-05, CTX-05, EVAL-04, HOST-04, RELEASE-05, VOICE-07)
and binds the new required checks into relevant dependency paths.

The canonical queue now has 49 scoped tasks. The public report loads six planning
documents with canonical UTF-8/LF hashes, keeps all 420 measured requests unchanged
and labels the new implementation/probes as future work. Desktop UI, optional
adaptation, Japanese and ASR remain explicitly deferred/conditional. Required
blocked gates cannot be treated as completed; optional exclusions need a decision.

The primary-computer author/committer rules remain unchanged. The unrelated
architecture document 014 and Auralis code/submodule pin stay outside the change.

## Verification

| Command | Observed result |
| --- | --- |
| `task plan:check` | Passed: 49 unique tasks, known statuses, acyclic dependencies, linked completion evidence and six document identities |
| `task docs:check` | Passed: 99 Markdown files; checked local file links resolve, external URLs/anchors not validated by this task |
| `task site:build` | Passed: one HTML, unchanged 420 measured requests and generated task progress |
| `task site:check` | Passed: matching evidence/document/task data, 49 rows, script and public artifact boundary checks |

Chrome local-preview inspection confirmed the 49 task rows, six document links,
the added completion/regression/retry/rollback note and explicit not-started Goal
label. The note/links were visually inspected in a real browser screenshot.
Publication is pending; its remote result will be recorded after deployment.
No production Rust/model/audio behavior is changed, so expensive real-model and
Rust checks are not repeated for this slice.
