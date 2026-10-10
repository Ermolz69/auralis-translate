# Chip/core warning v1: known failures caught, natural coverage absent

Date: 10 October 2026. Tasks: `EVAL-04`, `CTX-03`, `LONG-04`.
The [predeclared plan](2026-10-10-chip-core-warning-v1-plan.md) at
`064ce27` and [input freeze](2026-10-10-chip-core-warning-v1-freeze.json)
at `c790935`, SHA-256
`b6f8af4a5ef876905b91f2788c00420fa5702840e0413cf85e15edeae3643761`,
preceded the single offline capture. The rule bytes, prior v4 raw journal,
AI review and five complete private SRT drafts were rehashed. The source
groups were Vivo/MediaTek (467 cues, two drafts), Geekerwan ASUS (268
cues, one draft) and Sethlui restaurant (263 cues, two drafts). The five
drafts contributed 1,728 aligned source/target pairs; the v4 replay
added 192 selected answer cells. All are exposed development material,
not a sealed holdout. Two drafts of one source are correlated evidence.

The evaluation-only rule recognizes an explicit Chinese denial of
`多核` or a single multi-core chip and warns when the Russian target says
`многопроцессор...`. It abstains on processor-count source mentions and
quoted examples. A separate warning marks ungrammatical `один ядро`.
These are review signals, not repairs. Source, model output, checkpoints,
review state and product v8 were not changed.

The one capture ran from 09:58:44.604Z to 09:58:44.661Z (57 ms), with
zero model, ASR, TTS, network calls or retries. The [source-free machine
report](../reports/2026-10-10-chip-core-warning-v1.json) is SHA-256
`35e174e18982cf05a24769e1a42fb7b233f4f2e623ba47e1af68e8891a4a27aa`.
`task eval:chip-core-warning:v1:unit`, `freeze`, `preflight`, `report`
and `check` passed in their respective phases. An initial unit run exposed
a JavaScript ASCII word-boundary mistake for Cyrillic; the code was fixed
before the committed freeze and capture. An initial preflight path-join
error was also fixed before capture. Both failed command outputs remain
in the task record; the report has only one capture attempt.

| Exposed set | Source/target cells | Source denial triggers | Semantic warnings | Grammar warnings |
| --- | ---: | ---: | ---: | ---: |
| Selected v4 replies, AI source-aware labels | 192 | 18 cells | 13 | 18 |
| Vivo/MediaTek complete drafts | 934 | 0 cues | 0 | 0 |
| ASUS complete draft | 268 | 0 cues | 0 | 0 |
| Sethlui complete drafts | 526 | 0 cues | 0 | 0 |

Within the selected authored/natural v4 replies, the semantic warning
hit all **13/13** previously AI-marked errors of this exact denial
class; the grammar warning hit all **18/18** previously AI-marked
`один ядро` errors. Neither warning flagged another v4 cell. These
numbers reuse the same exposed source-aware AI judgments and do not
estimate independent precision, recall or real-file error rate. The
semantic rule intentionally misses other technical errors, including
affirmative multi-core confusion. Across the five complete drafts,
**all three source groups had zero matching source denial cues**;
therefore zero full-draft warnings provide no semantic true-negative or
false-positive estimate. Human bilingual review and human warning
adjudications remain zero.

**Product admission rejected.** The rule is too narrow to improve the
selected long-file translation or justify a checkpoint warning in the
product. Keep it as an evaluation-only regression signal for
REG-077/079 and REG-078/080. The next experiment must derive additional
source facts from *real* Chinese cue constructions on a distinct source,
declare matching and negative controls before target inspection, then
measure both coverage and false warnings against retained outputs. It
must not change originals or use closed holdout references in prompts.
Rollback is simply to omit this unconnected evaluation rule; v8 and all
accepted historical results remain unchanged. G3–G5, A1–A6 and
RELEASE-05 stay open.
