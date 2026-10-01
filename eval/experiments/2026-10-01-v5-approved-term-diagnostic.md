# Missing approved form: checkpoint advisory

Date: 1 October 2026. Partial `CTX-02` and `EVAL-04` engineering evidence.
Implementation commit: `c13c260`. The v5 term ledger already enforced
source, scene, reviewer-claim and scope admission, but accepted output was
checked only against the separate v3 glossary. A model could omit a scoped
v5 term without a term-specific checkpoint warning. `REG-045` freezes an
authored minimal reproducer and controls. It is a contract defect, not an
independently reviewed natural-model error.

For newly accepted checkpoints, `approved_term_missing` now records the
target segment ID and line index when the matching source line contains an
approved term and the matching Russian line contains neither its reviewed
target nor an allowed form (Unicode lowercase substring comparison). The
warning is advisory: it does not replace the model text, add a retry, or turn
structural acceptance into a language-quality pass. The v3 glossary warning
and v1–v4 request profiles are unchanged.

The authored test places the same Chinese venue in the first and last
blocks; both omissions are warned. A middle block accepts uppercase Russian
spelling and an allowed inflected form. A one-character-different Chinese
venue on a second line, an unrelated target whose context mentions the
venue, and a resumed run with all blocks saved produce no new false warning
or inference call. The SQLite test reopens a database and verifies that the
warning and unchanged accepted candidate survived. These are deterministic
fixtures, with zero model requests and zero human ratings.

Checks observed: `task test:v5-terms` passed six test binaries across five
crates; `task fmt`, `task lint`, `task eval:regression:catalog:check`,
`task site:build`, `task site:check`, `task docs:check` and
`task plan:check` passed. The
[versioned regression pack](../regressions/approved-term-missing-advisory-v1.json)
preserves the reproducible source/target pair and three related plus three
negative controls. It does not approve a canonical rendering for `REG-044`,
re-score old checkpoints, or establish cross-file name consistency. A final
whole-file bilingual review remains required before release. No G1–G9 or
A1–A6 gate changes status.
