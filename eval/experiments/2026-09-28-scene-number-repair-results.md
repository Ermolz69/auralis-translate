# Actor-number instruction did not repair REG-002

Status: failed semantic development probe, 28 September 2026. This is an AI
source-aware reading of authored Chinese scenes, not a human score or release
gate. The [predeclared plan](2026-09-28-scene-number-repair-plan.md) allowed
one prompt instruction edit and one paired four-scene run.

The tested variant's source was committed as `edeb5a0` after the run. The
report's `revision` field names the previous HEAD because the exact optimized
CLI was built from that variant before the commit; its SHA-256 below binds the
tested binary. The failed variant is retained in Git history, while the
active experimental v5 profile is restored to its prior template separately.

The candidate v5 template SHA-256 was
`66c4c5757b2f41388211805b9e5b96845eaf4edb252671f840efa44dcefba897`.
The no-context profile SHA-256 was
`474723ada793db8ddea36d32b72fe609009ff644774342fadebdaa84b35d1ae5`;
the scene profile was
`0ebdc057e51bf238b64e5ca1efbe4cae501a7235bf476f4d05c9c0a7e7e7e345`.
The optimized CLI SHA-256 was
`a34db2df0f6bf4dda9598bb2db2c9fefef97bbdad495df37c4054dff048f2b8e`.
The model and runtime identities are recorded in the
[raw report](../reports/scene-number-repair-2026-09-28.json), SHA-256
`35d0ce177248e4d0c2ace0c4681d0259283bc2d0d84891cca7601b03be4d1d24`.
The earlier [same-source run](2026-09-28-scene-context-results.md) remains the
immutable comparison baseline. Neither run sent references to the model.

| Case | Actor stated by source | Earlier scene output | Candidate scene output |
| --- | --- | --- | --- |
| `r01` | one older brother | `Прибыли.` | `Приехали.` |
| `r02` | one older sister | `Приехали.` | `Приехали.` |
| `r03` | one younger brother | `Приехали.` | `Прибыли.` |
| `r04` | two older brothers | `Прибыли.` | `Прибыли.` |

All 24 chats and 72 loopback calls completed; all eight whole-file outputs
passed structure, source preservation and byte-identical offline re-export.
The three singular actor outputs still have plural verb forms. The explicit
two-person control remains plural. Therefore the instruction alone did not
repair `REG-002`; keep it open and seek source-aware review before deciding
whether a different model or explicit approved referent evidence is needed.
Structural success does not establish semantic correctness.
