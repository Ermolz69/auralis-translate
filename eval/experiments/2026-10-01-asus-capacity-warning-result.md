# ASUS contextual capacity warning: REG-037

Date: 1 October 2026. This is one deterministic production-diagnostic
development slice under the [predeclared plan](2026-10-01-asus-capacity-audit-plan.md)
and [capacity contract](../../docs/reference/capacity-warning-v1.md).
The private Chinese ASUS source SHA-256 is
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`;
the unchanged 268-cue Russian candidate is
`aa74b20d4255f46c9a23ddfd0865dd2e221e7b08ab3cbceb8665be3b0c7b6e8b`.
This is an old 1.8B v6 model output, not a new translation or correction.

Before implementation, a stubbed separate detector made
`task test:capacity-diagnostics` fail one of two core tests. The minimal
`容量512G` → `Объём 2230 ГБ` case returned no warning. A second red run
showed that a Chinese suffix after `G` also hid the natural cue shape;
the boundary was corrected before the first private full-file audit. Both
failed runs remain recorded here. No model request or holdout evaluation
was made for these controls.

The implementation adds a separate `capacity_mismatch` review diagnostic.
It admits explicit `GB` quantities and a single uppercase `G` only in a
storage/memory source line without a weight marker. It compares normalized
numbers with Russian `ГБ`/inflected `гигабайт` or `GB`, while excluding
model codes, gigabits, throughput, ambiguous multiple `G` values and
unsupported terabytes. The [REG-037 pack](../regressions/catalog-v22.json)
pins one minimal case, eight related changes and fourteen negative controls.
`task test:capacity-diagnostics` passed two core tests and one SQLite reopen
test: an accepted `2230 ГБ` candidate stayed unchanged while the typed
warning survived checkpoint persistence.

The sole `task eval:regression:asus:v6:capacity:private` audit verified both
file hashes, 268 source/result cue numbers, the same timestamps and one text
line per cue before calling the production detector. It flagged **1/268**:
cue **83**. It reported only IDs; private subtitle text was not published.
The earlier physical-unit audit still has four IDs: 12, 127, 145 and 227.
These lists cover two narrow recognizers, not all factual errors. Cue 83's
capacity mismatch is an AI-identified issue for independent bilingual
review. There are zero human ratings, no change to saved SQLite checkpoints,
and no G3–G5 or spoken-script approval.

The Taskfile audit did not instrument exact UTC start/end, process memory or
per-line duration; those values are unknown and no speed claim follows.
The source/candidate/archive and earlier model/audio measurements are retained.

After implementation, `task eval:regression:catalog:check` verified 37
pinned packs through REG-037. `task test:measurement-diagnostics` retained
the older physical-unit behavior; `task eval:regression:asus:v6:units:private`
still flagged only 12 and 227 in its selected 44 cues. `task check` passed
formatting, Clippy with warnings denied and all Rust workspace tests in a
permitted process. `task eval:regression:check` passed the affected suite,
including the new capacity/SQLite checks, in the same process environment.
`task docs:check` verified 292 Markdown files, `task plan:check` verified
49 task IDs, and `task site:build` generated a 1,071,476-byte HTML report;
`task site:check` preserved the older measurements. The first `task fmt`
found layout differences in new Rust files; `task fmt:fix` corrected them
before the successful full `task check`. Live Pages publication remains a
separate post-push observation.
