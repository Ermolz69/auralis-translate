# One-factor 7B general fact reminder on the frozen Vivo development screen

Frozen before inference: 30 September 2026. Task: `CTX-02` / `EVAL-04` /
`DECIDE-01`. Question: does one general source-fact instruction reduce observed
numeric, actor, time and future/present errors without new structural failures?
The baseline is the [same-source 1.8B/7B fact screen](2026-09-30-vivo-fact-model-screen-result.md),
with report SHA-256 `1334cd24bd471f0c7ce9e9ac0d29459706b2da943939fbc1f4ddb830c3c3a7cd`
and raw journal SHA-256 `3b680456c4166ae54e2ce4cc7f374e85f68639c88a4f1b0a9d5730f30c58062d`.
Use its exact 28 7B requests: five natural source-only focus cues at seeds
101/202 and 18 authored related/negative development controls at seed 101.
Chinese source SRT SHA-256 `8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000`;
controls SHA-256 `3119d4d1c0b6489618d214808662195f0c1d6d0d47946a4726fcd5d7409a67ef`.
These are inspected development cases, **not** sealed holdout or human scores.

Use the same Hy-MT2 7B Q4_K_M weight SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
v5 profile and pinned llama.cpp runtime SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The sole changed factor is this exact English sentence inserted before the
existing JSON response instruction:

> Preserve explicit factual relations in target_slots: quantities with their units and counted entity, who acts or receives an action, clock time, and whether an event is past, current, planned, or hoped for. Do not infer a fact from background context when the target states something narrower.

All source/context JSON, target IDs, response schema, sampling parameters and
seeds remain byte-identical to baseline requests. The prompt contains no expected
English/Russian meaning, raw baseline answer or REG diagnosis. Preflight must
verify exact baseline identities and the one-sentence diff before server startup.
Budget: one server start, 28 chat requests, zero retries, 120 seconds per request,
180 seconds readiness and 10 minutes active wall time after hash checks. Save
every raw request/response, accepted structural text, tokens, latency, sampled
resources and failures in private append-only storage. No partial result becomes
an accepted SRT. Compare each case and both seeds against its archived baseline;
label any source-aware reading as AI triage. If this short screen improves cases,
test unseen source groups and independent human review before changing a release
profile. Stop without another variant when the declared budget is exhausted.
