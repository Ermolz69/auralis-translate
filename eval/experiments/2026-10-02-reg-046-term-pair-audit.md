# REG-046: count separate approved terms on one source line

Date: 2 October 2026. Partial `CTX-02`/`EVAL-04` engineering evidence.
This is an authored deterministic contract defect, with zero model requests
and zero independent Chinese–Russian ratings. The pre-fix committed base was
Translate `bdd8a7922d33a9cd2661d0e441124c1fae1033e3`.

The prior whole-result audit counted each applicable ledger term and source
line as a check, but used a line-level boolean for its warning. In the
minimal source line `海湾餐厅和海湾车站。`, both declared Russian forms were absent
from `Они пришли.`. The denominator was two while the report emitted only one
warning. A release reviewer could not identify which term failed or derive a
valid form-screen rate from those counts. The first
`task test:approved-terms:audit` after adding the reproducer failed exactly
at `warnings.len()`: observed 2 versus expected 3 across the complete
four-cue control document. The retained private red test log is
`.cache/approved-term-pair-red.txt`, SHA-256
`91856b017e4ecfa809acb5faf3e91305b4cc4567e2a3a6a82fab42f1ff3c4228`.

Report schema 2 now traverses every applicable source-line/ledger-term pair.
It reports `checked_term_pairs`, `missing_term_pairs` and a warning with the
zero-based ledger `term_index` for each omitted form. The minimal line yields
two checks and two distinct warnings. A later cue with one present form yields
one warning; one-character-different neighboring names and a repeated source
term outside its approved scope yield none. The 1,024-cue authored seam
ladder still checks the first, boundary and final cues. An existing allowed
inflected form remains a nonwarning. The source and result files are
read-only. The [pinned REG-046 pack](../regressions/approved-term-pair-count-v1.json)
contains the minimal source, expected pair counts, three related and three
negative controls; [catalog v30](../regressions/catalog-v30.json) adds it
without modifying older packs or outcomes.

This is only a literal form screen. A target may contain the form in the wrong
role, inflection or context, and undeclared terms are invisible. Reviewer and
evidence IDs inside an input ledger remain claims until checked externally.
There is no approved natural restaurant ledger, no new translation rating and
no G5 or RELEASE-05 pass. The old schema-1 report and its published evidence
remain historical rather than being reinterpreted as a term-pair score.

## Validation and public artifact

- `task test:approved-terms:audit`: one core and three CLI tests passed,
  including the red/green reproducer, all 1,024 authored cues and the
  no-warning count control.
- `task test:v5-terms`: affected v5 suites passed.
- `task test:cli:protocol`: seven machine-protocol tests passed.
- `task fmt` and `task lint`: passed.
- `task eval:regression:catalog:check`: catalogs through v30 passed.
- `task plan:check`: 49 tasks and linked completion evidence passed.
- `task docs:check`: 345 Markdown file links passed; external links and
  anchors are outside that check.
- `task site:build` and `task site:check`: generated and checked the
  1,124,398-byte single-file report; SHA-256
  `667dda82b6a4cf1d88cb4720786302d2ea88c1491028cfe7b796707ce86be4ab`.

These are engineering checks. They provide no new model response, translation
rating, listening result or clean-install evidence. Publication of the built
report is tracked separately from this local validation.
