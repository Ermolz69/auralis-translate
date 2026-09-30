# Archived ASUS whole-file measurement audit and REG-036

Date: 1 October 2026. The [predeclared read-only audit](2026-10-01-asus-whole-file-measurement-v2-plan.md)
used the pinned Chinese and Russian SRTs from the structurally complete ASUS
v6 run: source SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`,
candidate SHA-256
`aa74b20d4255f46c9a23ddfd0865dd2e221e7b08ab3cbceb8665be3b0c7b6e8b`.
The ignored Rust audit checked all 268 paired cue numbers, timestamps and one
text line per cue before calling the production measurement warning once per
pair. It made zero model requests and changed no source, candidate, SQLite
checkpoint or accepted result.

The first `task eval:regression:asus:v6:whole:private` run, on the REG-035
detector, emitted six review warning IDs: `12, 81, 83, 127, 145, 227`.
Inspection of 81 and 83 exposed a new detector false positive: uppercase `G`
in the source described memory/storage capacity, but the check interpreted it
as grams. This did not establish that the saved candidate was accurate. In
particular, cue 83 changes the source capacity in the Russian candidate;
that is an AI-identified source-fact issue for independent review, outside
the narrow physical-unit warning's coverage. No Chinese/Russian human
reviewer has scored these cues.

Two authored minimal cases, `内存16G` → `Память 16 ГБ` and `硬盘512G` →
`Накопитель 512 ГБ`, reproduced the false warning. Before the fix,
`task test:measurement-diagnostics` failed two of seven core tests: both
minimal cases and the related uppercase-target-unit control. Five core
tests still passed. The [v3 boundary](../../docs/reference/measurement-warning-v3.md)
keeps original case during extraction and excludes uppercase ASCII `G` as
grams while preserving lowercase `g`, explicit gram units, watts, signs and
full-width digits. The [REG-036 controls](../regressions/catalog-v21.json)
are authored development cases, not a model or human quality sample.

After the fix, `task test:measurement-diagnostics` passed seven core tests
and the SQLite checkpoint reopening test. The changed-code whole-file task
was rerun once and emitted four review warning IDs: `12, 127, 145, 227`.
The original 44-cue audit still flags 12 and 227. Cue 83's distinct storage
capacity error remains visible in the private candidate and requires
source-aware review; absence of this warning is not a pass. These four IDs
are warnings, not a count of all fact errors. This is AI-assisted diagnostic
triage with zero human ratings, not G3–G5 acceptance or a revised SRT.

`task eval:regression:catalog:check` verified 36 pinned packs through
REG-036. `task eval:regression:asus:v6:units:private` still flagged 12 and
227 in the previously selected 44 cues. `task eval:regression:check` passed
the affected deterministic suite in a permitted process. `task check` passed
formatting, Clippy with warnings denied and all Rust workspace tests in the
same environment. `task docs:check` verified 288 Markdown files and
`task plan:check` verified 49 task IDs. The first `task fmt` found only layout
differences in the new private audit test; `task fmt:fix` corrected them, and
the subsequent full `task check` passed. `task site:build` generated a
1,068,767-byte single-file report, and `task site:check` passed including
older measurements. Live publication is checked separately after push.

The audit command did not instrument exact UTC start/end or process memory;
these values are unknown and no timing/resource comparison is made. The SRTs
remain private because redistribution rights have not been admitted. The
detector's no-warning result on `G`-abbreviated storage does not resolve the
candidate's storage-capacity mistake.
