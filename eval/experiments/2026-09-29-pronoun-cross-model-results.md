# Matched four-scene 1.8B and 7B actor-context screen

Status: partial `CTX-02` and `EVAL-04` development evidence, 29 September
2026. The [frozen plan](2026-09-29-pronoun-cross-model-plan.md) preceded both
model runs. This is one AI-authored, unreviewed development comparison, not
blind bilingual review, a natural-file result or a release gate.

Both models used the same four Chinese scenes `p01–p04` and current v5
prompt/template. Each scene ran as a whole SRT with and without admitted
source-only context; proposed Russian meanings stayed outside every model
request. The complete raw reports are [1.8B](../reports/pronouns-1b-p01-p04-2026-09-29.json)
and [7B](../reports/pronouns-7b-p01-p04-2026-09-29.json), SHA-256
`7c2dc3bf8b5cdcaf93e50d9cda7824ac125401581f53e5934b8adf51040bf21b`
and `a701b0970825ee8ec399084c47df36cbddd1a51b0af4f3d93e1a368ae28069ac`.
The [1.8B](../reports/pronouns-1b-p01-p04-journal-check-2026-09-29.json)
and [7B](../reports/pronouns-7b-p01-p04-journal-check-2026-09-29.json)
SQLite checks match every saved request, raw response, token preflight and
accepted target. Their SHA-256 values are
`f206c6eba516118a11ffff06842e404c6caec55ccbb096f993a6fe76e1f8c125`
and `6d9fbbe43968accfc3a01c111b2a3ae1ba510947761915c726c42d71abb11a8d`.

| Development case | Proposed target meaning* | 1.8B isolated → scene | 7B isolated → scene |
| --- | --- | --- | --- |
| `p01`, one older brother arrived | He arrived | `Пришло.` → `Приехали.` | `Прибыли.` → `Мы прибыли.` |
| `p02`, father returned | He returned | `Вернулся.` → `Вернулся.` | `Вернулся.` → `Вернулся.` |
| `p03`, younger brother agreed | He agreed | `Согласовано.` → `Согласился.` | `Согласился.` → `Согласился.` |
| `p04`, male teacher departed | He left first | `Ушел.` → `Ушёл.` | `Ушёл первым.` → `Ушел раньше.` |

*These are AI-authored source interpretations, not independent reference
translations. `p01` again exhibits the open `REG-002` actor-number defect:
one older brother is explicit in the preceding Chinese cue, but the scene
outputs use plural Russian actors. The 7B isolated output is plural too, so
context did not repair it. `p02–p04` are related singular-actor controls on
the same template; their scene outputs are singular in this one repetition.
The `p04` difference between "first" and "earlier" needs source-aware human
adjudication. No score or general model ranking follows from four scenes.

Each model returned 20 HTTP-200 chat responses across eight full SRT files
and 64 total loopback requests; there were zero in-run failures. Each scene
arm made ten `/apply-template` and ten `/tokenize` calls; all token counts
matched the server's corresponding `usage.prompt_tokens` and stayed below
the 2,048-token context after 256 response and 64 safety tokens. Both runs
passed strict structural checks, retained original bytes and produced
byte-identical offline re-exports. The Git candidate was `19fb4cb` for
both; CLI SHA-256 was
`0df2755c9e9c63d169318e009bd271d8c0903c2a5564e62305a0a2a36077055c`.
The only preexisting tracked modification was the owner's unrelated
`docs/architecture/014-result-history-selection.md`, excluded from commits.

| Observed metric | 1.8B Q4_K_M | 7B Q4_K_M |
| --- | ---: | ---: |
| Chat prompt / completion tokens | 4,135 / 651 | 3,982 / 591 |
| Largest rendered chat prompt | 249 | 243 |
| Sum of chat HTTP times | 8,603.445 ms | 13,162.945 ms |
| Entire script including startup and verification | 74,663 ms | 240,964 ms |
| Sampled server working-set peak | 1,557,999,616 bytes | 5,060,464,640 bytes |
| Sampled whole-device GPU-used peak | 2,180 MiB | 5,751 MiB |

The runs were sequential on an active Windows 10/i7-6900K/RTX 3070 8 GiB
machine; GPU samples include other processes and approximately one-second
sampling can miss true peaks. Whole-script times include repeated CLI/model
verification and server startup and do not form a controlled speed claim.
The 1.8B first Taskfile invocation failed with sandbox `spawn EPERM` after
the build and before any model request; the [failure record](../reports/pronouns-1b-sandbox-failure-2026-09-29.json)
is retained. The identical predeclared task succeeded with permitted child
process execution. The model, prompt and budget were not changed for that
retry.

`task eval:context:pronouns:1b:probe` passed on its permitted retry;
`task eval:context:pronouns:7b:probe` passed with 14 profile/release tests;
`task eval:context:pronouns:journal:check` passed for both reports;
`task eval:context:pronouns:report:check` passed frozen source, profile,
request and regression checks. Translation adequacy, natural long-file
coverage and independent human review remain open.
