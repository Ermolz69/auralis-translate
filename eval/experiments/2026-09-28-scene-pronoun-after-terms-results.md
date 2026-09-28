# REG-002 persists under the current v5 terms template

Status: real model regression on 28 September 2026, source-aware AI reading
of authored development scenes, no independent human review. The
[predeclared plan](2026-09-28-scene-pronoun-after-terms-plan.md) re-ran the
same four Chinese sources and two arms after the v5 template changed.
No term ledger was supplied in either arm, and no reference was sent to
the model.

| Case | Chinese actor | No context | Scene context |
| --- | --- | --- | --- |
| `r01` | one older brother | Пришёл. | Приехали. |
| `r02` | one older sister | Пришло. | Приехали. |
| `r03` | one younger brother | Пришло. | Приехали. |
| `r04` | two older brothers | Пришло. | Прибыли. |

The scene arm retained a plural predicate for all three singular actors;
the explicit two-brother negative control remained plural. Thus the template
change did not repair `REG-002`. The no-context arm does not know the actor
and cannot itself establish correct referent agreement. All eight whole-file
outputs passed protected-byte/structure checks and byte-identical offline
re-export. The run produced 24 chats, 72 loopback requests and 72 sampled
resource observations with no transport or validation failures.

The [raw report](../reports/scene-pronoun-after-terms-2026-09-28.json)
has SHA-256
`aae59d0702fa44fd20bf310d5fc8534dc68aea6aa43a3538c7aac941c279617d`.
It retains exact source/profile/model/runtime identities, prompts, raw and
accepted responses, tokenizer counts, elapsed times, memory samples and
result hashes. This does not replace the earlier failed repair or close the
semantic regression. Human source-aware adjudication and a separately
predeclared alternative remain open.
