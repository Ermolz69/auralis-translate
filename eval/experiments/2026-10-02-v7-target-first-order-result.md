# Target-first input order: bounded real-model result

Date: 2 October 2026. Frozen [plan](2026-10-02-v7-target-first-order-plan.md);
redacted [machine report](../reports/2026-10-02-v7-target-first-order.json).
This is an authored development screen for partial `LONG-01`/`EVAL-04`, not
an eligible natural-media or independent language-quality gate.

The pinned Hy-MT2 1.8B Q4_K_M model and llama.cpp runtime completed 12 real
chat requests and 24 template/token preflights on three Chinese target/context
pairs. All HTTP responses were 200, stopped normally, matched target ID 1,
and had tokenizer counts equal to reported prompt usage. The only within-pair
change was JSON field order: `source_context` before `target_slots` (current
v7 baseline) versus `target_slots` before `source_context` (experimental).
Each case used seeds 101 and 202 with reversed arm order. The source and model
identities, exact requests, full raw responses, resource samples, failures and
uncommitted worktree status are retained in private report SHA-256
`32e27379eba888a588eff70383e8c0afc3cb15b73359640c3d9a62498250d87b`.
No Russian reference text entered prompts.

| Case | Baseline, both seeds | Target-first, both seeds | Source-aware AI reading |
| --- | --- | --- | --- |
| Wang says tomorrow is not Friday; neighboring ticket price | `Этот билет стоит десять юаней, не нужно платить сто юаней.` | `Менеджер Ванг сказал, что завтра не будет пятница.` | Known wrong-cue substitution occurred 2/2 in baseline and 0/2 in target-first. Target-first wording is grammatically rough. |
| Doctor Chen says no rain today; neighboring sleeping cat | `Доктор Чен сказал, что сегодня не идет дождь.` | `Доктор Чен сказал, что сегодня не шел дождь.` | Both preserve doctor and negation; tense/aspect differs, without human adjudication. No cat copied. |
| He returned the key to the manager; neighbor says Li borrowed it | `Он вернул ключ менеджеру.` | `Он вернул ключ менеджеру.` | Both preserve return rather than borrow and retain key/manager. |

Across six baseline and six target-first chats, both arms used 1,418 prompt
tokens. Baseline used 254 completion tokens and 2,891 ms summed chat HTTP;
target-first used 236 and 2,511 ms. **No speed claim** follows: the server
reported 693 versus 1,093 cached prompt tokens and all requests shared one
active process. Wall time including startup and preflights was 8,315 ms. Two
sparse samples measured server working set up to 1,546,190,848 bytes and
device-wide GPU use up to 3,794 MiB, not isolated peaks.

This result supports a new **opt-in prompt identity** for further development.
It does not show that field order prevents nonmonetary context swaps, handles
multiple targets, improves natural long-file quality, or resolves Chinese–
Russian adequacy generally. No product checkpoint or subtitle file was
accepted from this direct probe. The existing v7 money guard still rejects
the observed wrong currency under a nonmoney target. A versioned provider
implementation must retain v7 identity and durability behavior, then run the
same source through its actual CLI path and related source/context controls.
Human review remains 0; RELEASE-05 and G3–G5/A1–A6 remain open.
