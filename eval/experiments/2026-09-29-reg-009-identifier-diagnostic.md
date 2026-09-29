# REG-009: exact source identifier diagnostic

Status: deterministic diagnostic implemented; model fact preservation remains
open. The frozen [long v6 postflight](2026-09-29-long-v6-postlength-results.md)
found 665 identifier mismatches among 1,280 target lines. Cue 2 has source
`工程 AUR-0002：不要打开这扇门。` and accepted output
`Не открывайте эту дверь.`. This is a factual omission in a structurally valid
synthetic result, not an unsupported SRT grammar or a human-reviewed score.
The archived run, 3,847 requests and output bytes remain unchanged.

The [REG-009 pack](../regressions/long-v6-identifier-loss-v1.json) pins the
affected report, journal and profile hashes, the smallest observed failure,
related changed-digit/lookalike/duplicate cases and negative controls.
The [v1 rule](../../docs/reference/source-identifier-diagnostic-v1.md) compares
exact ASCII identifier multisets per source and accepted target line. A
`identifier_mismatch` warning is stored with the checkpoint. It is advisory
for existing profiles, so no prompt, model request, retry or historical result
identity changes. The 665 archived mismatches were calculated offline; the old
SQLite checkpoints were not retroactively rewritten with new warnings.

Observed checks on 29 September 2026:

| Task | Result |
| --- | --- |
| `task test:identifier-diagnostics` | 2 core tests and 1 SQLite reopen test passed; omission, mutation, lookalike, duplicate, extra, order, context-only, date/time and Unicode-boundary controls |
| `task eval:regression:check` | Passed after sandbox child-process `EPERM` retry; archived REG-009 facts and beginning/middle/end failures retained |
| `task test:context-v6` | 1 v6 schema, 10 profile and 3 CLI admission tests passed |
| `task fmt` / `task lint` | Passed after fixing one Clippy slice warning |
| `task docs:check` / `task plan:check` | Passed before this record was linked; rerun with final record |

This detects a narrow class of factual corruption and makes new runs reviewable.
It does not fix the model's translation. A strict rejection or source-slot
protection experiment needs a new versioned profile, matched-source model
comparison, bounded attempts and a full-file rerun. Chinese names, amounts,
negation, cohesion, natural-corpus review and release gates remain open.

The first [matched prompt reminder screen](2026-09-29-reg-009-prompt-screen-results.md)
found 2/8 exact identifiers in both arms. That instruction is not adopted.
The separate [strict guard candidate](../../docs/reference/strict-source-identifier-guard-v1.md)
rejects this mismatch before checkpoint commit; its real long-file completion
and language quality remain untested.
