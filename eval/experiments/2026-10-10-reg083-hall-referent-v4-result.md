# REG-083 Hall-stick warning v4: known substitution flagged, product unchanged

Date: 10 October 2026. Partial `EVAL-04`/`CTX-03` evidence under the
[frozen plan](2026-10-10-reg083-hall-referent-v4-plan.md). The candidate is
an evaluation-only warning, not a translation correction or release gate.

The same exposed ASUS development source (268 Chinese cues, SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`)
and retained 7B/v8 Russian draft (SHA-256
`746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee`)
were read without modification. The frozen v3 rule and report are the
baseline. V4 added only a source-cue-scoped Hall-stick lexical presence
warning; the old warnings were replayed unchanged.
The current machine index is [catalog v59](../regressions/catalog-v59.json),
which retains catalog v58 and the earlier v3 outcome.

## Observed comparison

The source-only preflight selected cue **24** and no other cue. One offline
replay at clean commit `e59ae1e7e44df058cc38d3992666069fc9609454`
ran from 12:27:42.662 to 12:27:42.795 UTC, with 131 ms measured process
time. All **268/268** source/target IDs and timing rows matched. V3 issued
**0** warnings. V4 issued **1**, on cue 24 with `hall` missing from the
Russian cue; no other natural cue was flagged. No model, ASR, TTS, network
request or retry occurred. The [machine record](../reports/2026-10-10-reg083-hall-v4.json)
is SHA-256 `73fcf6706d96f7284a69598585973fa3cd0676c8ee70869609e65aefc707ddea`.

The separate [AI source-aware review](../reports/2026-10-10-reg083-hall-v4-ai-review.json)
inspected the single warning and source cues 23–25. The Chinese cue denies
Hall-effect joysticks; the saved Russian cue instead denies a galvanometric
control lever. The warning therefore catches the previously recorded
[REG-083](../regressions/reg-083-asus-hall-stick-substitution-v1.json)
substitution. This is an AI judgment on an exposed known error, not an
independent bilingual rating.

`task eval:source-relations:v4:unit` passed ten focused controls, including
all six previously unrun REG-083 related/source-negative phrases plus
additional component, polarity and adjacency cases. The source/draft pair
passed `preflight`, `probe` and `check`; the checker recomputed every warning
from the pinned private files. Source/draft, v3 rule/report and v8 results
were not rewritten. The full raw texts remain private; the public records
contain identities, cue IDs, reasons and hashes.

`task eval:regression:catalog:v59:check` and
`task eval:regression:catalog:portable:check` passed. The broader
`task eval:regression:catalog:recent:check` stopped at v45 because this
isolated worktree lacks its ignored historical private `report.json`; this
is not recorded as a passing archive check.

## Decision and limits

**Keep v4 out of the product.** Only one natural source cue triggered, and
it was the exposed known error. The 267 untriggered cues cannot estimate
false-warning precision for Hall-stick statements; no distinct natural
Hall-stick source or independent reviewer was available. The lexical rule
can miss paraphrases or flag a valid fact moved into an adjacent target
cue. A second natural source with applicable positive and negative uses,
followed by human adjudication of all warnings, is required before product
warning admission. No full-file translation or TTS rerun follows this
screen. `DATA-03`, `CTX-03`, `EVAL-04`, G3–G5, A1–A6 and RELEASE-05 remain
open. Rollback is to omit the v4 `eval/` rule and keep the unchanged v8
profile, original source and accepted history.
