# Deterministic SRT property check result

Date: 29 September 2026. Scope: `EVAL-04` format regression under the
[predeclared plan](2026-09-29-srt-generated-roundtrip-plan.md). Checked parent:
Translate `db1a4b0`; the new test and Taskfile command were uncommitted during
the run. No model, audio or third-party corpus was used.

`task test:srt:generated` passed two tests across all 64 fixed seeds and 1,037
generated cues. Files ranged from one to 32 cues and varied line endings, BOM,
terminal newline policy, repeated external labels, one to three text lines,
Chinese/Russian/ASCII and numeric text. Every accepted file rendered its
original bytes exactly. After every text slot was replaced, reparse retained
ordered internal IDs, labels, timing, line counts, replacement text and the
same protected byte runs. In the negative arm, inserting unsupported markup
into one slot per seed was rejected before translation in 64/64 cases.

Initial `task fmt` identified only layout changes in the new test. The first
`task lint` found three Clippy integer-style warnings and one forbidden
`expect_err` in the new test. After `task fmt:fix` and those test-only edits,
`task test:srt:generated`, `task fmt` and workspace `task lint` passed. No parser
defect was found and no production parser/renderer code changed. These
generated structural checks do not establish semantic translation quality,
natural-file performance, rights or G1–G9 release acceptance.

The generated check was then added to the permanent Taskfile regression tier.
`task eval:regression:check` passed, including all 17 retained model-failure
packs and the new format check. The known Windows sandbox child-process limit
was handled by running that task with permitted process execution.
