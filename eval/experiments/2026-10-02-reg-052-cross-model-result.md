# Same-prompt 1.8B/7B screen favors 7B on known name controls

Date: 2 October 2026. Frozen [plan](2026-10-02-reg-052-cross-model-plan.md);
[public paired report](../reports/2026-10-02-reg-052-cross-model.json).
The ignored private 7B report SHA-256 is
`4bf314497b25413a1b8d522ef191dff4ed1fd8a2795295810aedaa4326097cf1`;
the earlier 1.8B report SHA-256 is
`96ac8d1b1b6c126b3e66052702560ff9b1aca30d0809ac1b59ce0f5a2b161ebf`.
`task eval:regression:cross-model:check` verifies every paired prompt byte,
request identity, raw response, template/tokenizer preflight and public
row. The only chat-request field changed between models is the alias.
The 7B model, runtime and identity-manifest hashes are pinned in the plan.

Both local models returned structurally valid JSON for 12/12 paired
source-with-context requests, two seeds each for six known authored
REG-052 controls. The 7B model retained `Сяо Ли` in both negation responses
and both later-scene responses where 1.8B varied or shortened it. On the
document hand-over question, 1.8B's seed-202 raw candidate began
`Заплатил ли…`; 7B's same-seed candidate began `Передал ли…` and retained
`Сяо Чжан`. The other seed's 7B candidate began `Отдал ли…`; both are
closer to the target action by source-aware AI inspection. The unnamed
actor question remained unnamed in both models. The full-name negative
control stayed distinct from Xiao Li in both.

| Known case / seed | 1.8B raw candidate | 7B raw candidate |
| --- | --- | --- |
| Hand document / 202 | `Заплатил ли Чжан Сяо документ доктору Чен?` | `Передал ли Сяо Чжан документы доктору Чэню?` |
| Xiao Li negation / 202 | `Ли Шао Ли не передал ключи менеджеру Вану.` | `Сяо Ли не передал ключи менеджеру Вану.` |
| Wang asks where Xiao Li / 101 | `Менеджер Ван спрашивает, где Ли.` | `Менеджер Ванг спрашивает, где находится Сяо Ли?` |

These are **known development cases**, not an unseen estimate of model
accuracy. The 7B outputs still vary `王` between `Ванг` and `Ван`; one
candidate says `менеджеру Ван`, with a Russian case problem. Document/key
number and actor forms need review. No Chinese–Russian person rated these
outputs, and no text is an approved script. This result supports an
experimental 7B v8 CLI screen on the same authored source, followed by
natural long-file scenes and name-scoped terminology tests. It does not
justify replacing an existing model profile or passing G3–G9/A1–A6.

The twelve 1.8B calls used 3,284 prompt / 473 completion tokens and
4,692 ms summed chat HTTP time. The twelve 7B calls used 3,240 / 452
tokens and 11,048 ms. Separate sequential server sessions, different
tokenizers and cache states prevent a controlled speed claim. The 7B wall
time was 17,212 ms. Three sparse samples observed at most 5,060,833,280
bytes 7B server working set and 7,259 MiB device-wide GPU use on an 8 GiB
RTX 3070; these are not isolated peaks or headroom guarantees. The 7B
requests used the v8 prompt directly against the pinned model; a checked
7B v8 product manifest and durable CLI result remain future work.
